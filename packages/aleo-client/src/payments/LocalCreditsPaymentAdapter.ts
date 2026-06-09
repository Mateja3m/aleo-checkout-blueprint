import type { SubmittedPayment } from "@aleo-checkout/shared-types";
import {
  CREDITS_PROGRAM_ID,
  TESTNET_API_HOST,
  type CreditsTestnetConfig,
  redactAddress
} from "../testnet-credits/config.js";
import {
  assertNoFixtureRecord,
  assertSafeActualTransactionId,
  createRecordId,
  microcreditsToCredits,
  parseMicrocreditsFromRecordPlaintext
} from "../testnet-credits/records.js";
import type { CreditsRecordSummary, CreditsTransactionStatus, CreditsTransferResult } from "../testnet-credits/types.js";

type Sdk = typeof import("@provablehq/sdk/testnet.js");

export class LocalCreditsPaymentAdapter {
  constructor(private readonly config: CreditsTestnetConfig) {
    if (config.adapterMode !== "testnet-credits-local" || config.network !== "testnet") {
      throw new Error("LocalCreditsPaymentAdapter requires testnet-credits-local mode on testnet.");
    }
  }

  async validateAccounts(): Promise<{ customerAddress: string; merchantAddress: string }> {
    const sdk = await loadSdk();
    if (!sdk.Account.isValidAddress(this.config.customerAddress)) {
      throw new Error("ALEO_CUSTOMER_ADDRESS is not a valid Aleo address.");
    }
    if (!sdk.Account.isValidAddress(this.config.merchantAddress)) {
      throw new Error("ALEO_MERCHANT_ADDRESS is not a valid Aleo address.");
    }

    const customer = new sdk.Account({ privateKey: this.config.customerPrivateKey });
    const merchant = new sdk.Account({ privateKey: this.config.merchantPrivateKey });
    try {
      if (customer.address().toString() !== this.config.customerAddress) {
        throw new Error("ALEO_CUSTOMER_PRIVATE_KEY does not derive ALEO_CUSTOMER_ADDRESS.");
      }
      if (merchant.address().toString() !== this.config.merchantAddress) {
        throw new Error("ALEO_MERCHANT_PRIVATE_KEY does not derive ALEO_MERCHANT_ADDRESS.");
      }
    } finally {
      customer.destroy();
      merchant.destroy();
    }

    return {
      customerAddress: redactAddress(this.config.customerAddress),
      merchantAddress: redactAddress(this.config.merchantAddress)
    };
  }

  async getPublicCreditsBalanceMicrocredits(address = this.config.customerAddress): Promise<number> {
    const client = await this.createClient();
    try {
      return client.networkClient.getPublicBalance(address);
    } finally {
      destroyAccount(client.account);
    }
  }

  async listCustomerCreditRecords(options: { startHeight?: number; endHeight?: number } = {}): Promise<CreditsRecordSummary[]> {
    const client = await this.createClient();
    try {
      const latestHeight = await client.networkClient.getLatestHeight();
      const requestedStartHeight = options.startHeight ?? Math.max(0, latestHeight - this.config.scanBlockWindow);
      const requestedEndHeight = options.endHeight ?? latestHeight;
      const endHeight = Math.min(requestedEndHeight, latestHeight);
      const startHeight = requestedStartHeight >= endHeight ? Math.max(0, endHeight - 1) : requestedStartHeight;
      const records = await client.networkClient.findUnspentRecords(
        startHeight,
        endHeight,
        [CREDITS_PROGRAM_ID],
        undefined,
        undefined,
        [],
        this.config.customerPrivateKey
      );

      return records.map((record: any) => {
        const recordPlaintext = record.toString();
        assertNoFixtureRecord(recordPlaintext);
        return {
          recordId: createRecordId({ recordPlaintext }),
          programId: CREDITS_PROGRAM_ID,
          recordName: "credits",
          owner: String(record.owner().toString?.() ?? this.config.customerAddress),
          amountMicrocredits: parseMicrocreditsFromRecordPlaintext(recordPlaintext),
          spent: false,
          recordPlaintext
        };
      });
    } finally {
      destroyAccount(client.account);
    }
  }

  async createPrivateCreditsRecord(): Promise<CreditsTransferResult> {
    const client = await this.createClient();
    try {
      const balance = await client.networkClient.getPublicBalance(this.config.customerAddress);
      if (balance < this.config.paymentAmountMicrocredits) {
        throw new Error("Customer public Credits balance is too low to create the private Credits record.");
      }

      const startBlockHeight = await client.networkClient.getLatestHeight();
      const txId = await client.programManager.transfer(
        microcreditsToCredits(this.config.paymentAmountMicrocredits),
        this.config.customerAddress,
        "publicToPrivate",
        0,
        false
      );
      assertSafeActualTransactionId(txId);

      return {
        transactionId: txId,
        startBlockHeight,
        amountMicrocredits: String(this.config.paymentAmountMicrocredits),
        merchantAddress: this.config.customerAddress
      };
    } finally {
      destroyAccount(client.account);
    }
  }

  async ensurePrivateCreditsRecord(): Promise<CreditsRecordSummary> {
    return this.ensurePrivateCreditsRecordWithOptions();
  }

  async ensurePrivateCreditsRecordWithOptions(options: {
    startHeight?: number;
    onProgress?: (message: string) => void;
  } = {}): Promise<CreditsRecordSummary> {
    try {
      const records = await this.listCustomerCreditRecords(
        typeof options.startHeight === "number" ? { startHeight: options.startHeight } : {}
      );
      const record = records.find((candidate) => Number(candidate.amountMicrocredits) >= this.config.paymentAmountMicrocredits);
      if (record?.recordPlaintext) return record;
    } catch {
      // Fall through to public-to-private creation.
    }

    options.onProgress?.("No reusable private credits record found in the preferred block window. Creating a fresh private record.");
    const created = await this.createPrivateCreditsRecord();
    options.onProgress?.("Public-to-private transaction submitted. Waiting for acceptance.");
    await this.pollAcceptedTransaction(created.transactionId);
    const endHeight = await this.getLatestHeight();
    const records = await this.listCustomerCreditRecords({
      startHeight: created.startBlockHeight,
      endHeight
    });
    const record = records.find((candidate) => Number(candidate.amountMicrocredits) >= this.config.paymentAmountMicrocredits);
    if (!record?.recordPlaintext) {
      throw new Error("Private Credits record was not found after publicToPrivate transaction.");
    }
    return record;
  }

  async submitPrivateCreditsTransfer(input?: {
    orderId?: string;
    onProgress?: (message: string) => void;
    recordSearchStartHeight?: number;
  }): Promise<SubmittedPayment & CreditsTransferResult> {
    input?.onProgress?.("Checking for an unspent private credits record.");
    const record = await this.ensurePrivateCreditsRecordWithOptions({
      ...(typeof input?.recordSearchStartHeight === "number" ? { startHeight: input.recordSearchStartHeight } : {}),
      ...(input?.onProgress ? { onProgress: input.onProgress } : {})
    });
    if (!record.recordPlaintext) {
      throw new Error("No private Credits record plaintext is available for transfer.");
    }
    assertNoFixtureRecord(record.recordPlaintext);
    input?.onProgress?.("Private credits record found.");

    const client = await this.createClient();
    try {
      const startBlockHeight = await client.networkClient.getLatestHeight();
      input?.onProgress?.("Building and proving the private transfer locally. First runs can take a few minutes.");
      const tx = await client.programManager.buildTransferTransaction(
        microcreditsToCredits(this.config.paymentAmountMicrocredits),
        this.config.merchantAddress,
        "private",
        0,
        false,
        { startHeight: Math.max(0, startBlockHeight - this.config.scanBlockWindow), unspent: true, nonces: [] },
        record.recordPlaintext
      );
      input?.onProgress?.("Private transfer proof built. Submitting transaction to testnet.");
      const txId = await client.networkClient.submitTransaction(tx);
      assertSafeActualTransactionId(txId);
      input?.onProgress?.("Private transfer submitted.");

      return {
        transactionId: txId,
        orderId: input?.orderId ?? "ord_testnet_credits",
        status: "submitted",
        submittedAt: new Date().toISOString(),
        mocked: false,
        startBlockHeight,
        transferType: "private",
        amountMicrocredits: String(this.config.paymentAmountMicrocredits),
        merchantAddress: this.config.merchantAddress
      };
    } finally {
      destroyAccount(client.account);
    }
  }

  async pollAcceptedTransaction(
    transactionId: string,
    options: { timeoutMs?: number; intervalMs?: number } = {}
  ): Promise<CreditsTransactionStatus> {
    assertSafeActualTransactionId(transactionId);
    const timeoutMs = options.timeoutMs ?? 120_000;
    const intervalMs = options.intervalMs ?? 5_000;
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
      const status = await this.getTransactionStatus(transactionId);
      if (status.status === "accepted") return status;
      if (status.status === "rejected") {
        throw new Error(`Transaction ${transactionId} was rejected.`);
      }
      await sleep(intervalMs);
    }

    throw new Error(`Timed out waiting for transaction ${transactionId} to be accepted.`);
  }

  async getTransactionStatus(transactionId: string): Promise<CreditsTransactionStatus> {
    assertSafeActualTransactionId(transactionId);
    const client = await this.createClient();
    try {
      const confirmed = await client.networkClient.getConfirmedTransaction(transactionId);
      const rawStatus = String((confirmed as any).status ?? "confirmed");
      return {
        transactionId,
        status: rawStatus === "rejected" ? "rejected" : "accepted",
        blockHeight: typeof (confirmed as any).height === "number" ? (confirmed as any).height : undefined,
        rawStatus
      };
    } catch {
      try {
        const tx = await client.networkClient.getTransaction(transactionId);
        const rawStatus = String((tx as any).status ?? "unknown");
        return {
          transactionId,
          status: rawStatus === "rejected" ? "rejected" : "unknown",
          rawStatus
        };
      } catch {
        return { transactionId, status: "not_found" };
      }
    } finally {
      destroyAccount(client.account);
    }
  }

  async getLatestHeight(): Promise<number> {
    const client = await this.createClient();
    try {
      return client.networkClient.getLatestHeight();
    } finally {
      destroyAccount(client.account);
    }
  }

  private async createClient(): Promise<{
    sdk: Sdk;
    account: InstanceType<Sdk["Account"]>;
    networkClient: InstanceType<Sdk["AleoNetworkClient"]>;
    recordProvider: InstanceType<Sdk["NetworkRecordProvider"]>;
    programManager: InstanceType<Sdk["ProgramManager"]>;
  }> {
    const sdk = await loadSdk();
    const account = new sdk.Account({ privateKey: this.config.customerPrivateKey });
    const networkClient = new sdk.AleoNetworkClient(TESTNET_API_HOST);
    networkClient.setAccount(account);
    networkClient.setVerboseErrors(true);
    const keyProvider = new sdk.AleoKeyProvider();
    keyProvider.useCache(true);
    const recordProvider = new sdk.NetworkRecordProvider(account, networkClient);
    const programManager = new sdk.ProgramManager(TESTNET_API_HOST, keyProvider, recordProvider);
    programManager.setAccount(account);
    return { sdk, account, networkClient, recordProvider, programManager };
  }
}

async function loadSdk(): Promise<Sdk> {
  const sdk = await import("@provablehq/sdk/testnet.js");
  sdk.setLogLevel("silent");
  return sdk;
}

function destroyAccount(account: { destroy?: () => void } | undefined): void {
  account?.destroy?.();
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
