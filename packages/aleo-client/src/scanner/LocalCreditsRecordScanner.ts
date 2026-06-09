import type { EncryptedRecordCandidate } from "@aleo-checkout/shared-types";
import {
  CREDITS_PROGRAM_ID,
  CREDITS_RECORD_NAME,
  TESTNET_API_HOST,
  type CreditsTestnetConfig
} from "../testnet-credits/config.js";
import {
  assertNoFixtureRecord,
  assertSafeActualTransactionId,
  createRecordId,
  parseMicrocreditsFromRecordPlaintext,
  parseOwnerFromRecordPlaintext
} from "../testnet-credits/records.js";

type Sdk = typeof import("@provablehq/sdk/testnet.js");

/**
 * PoC-only local scanner.
 *
 * It scans a narrow recent testnet block range through the official SDK and
 * decrypts candidate records with the merchant key inside this adapter. RSS
 * remains the production-oriented indexing extension.
 */
export class LocalCreditsRecordScanner {
  constructor(private readonly config: CreditsTestnetConfig) {
    if (config.adapterMode !== "testnet-credits-local" || config.network !== "testnet") {
      throw new Error("LocalCreditsRecordScanner requires testnet-credits-local mode on testnet.");
    }
  }

  async scanMerchantRecords(input: {
    startBlockHeight: number;
    transactionId?: string;
    timeoutMs?: number;
    intervalMs?: number;
    onProgress?: (message: string) => void;
  }): Promise<EncryptedRecordCandidate[]> {
    if (input.transactionId) assertSafeActualTransactionId(input.transactionId);
    const timeoutMs = input.timeoutMs ?? 120_000;
    const intervalMs = input.intervalMs ?? 5_000;
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
      if (input.transactionId) {
        input.onProgress?.("Checking the submitted transaction directly for merchant-owned records.");
        const directRecords = await this.scanTransaction(input.transactionId);
        if (directRecords.length > 0) return directRecords;
      }

      const latestHeight = await this.getLatestHeight();
      if (input.transactionId) {
        input.onProgress?.("Locating the accepted transaction block height.");
        const transactionHeight = await this.locateTransactionHeight({
          startBlockHeight: input.startBlockHeight,
          endBlockHeight: latestHeight,
          transactionId: input.transactionId
        });
        if (typeof transactionHeight === "number") {
          const transactionWindow = {
            startBlockHeight: Math.max(input.startBlockHeight, transactionHeight - 2),
            endBlockHeight: Math.min(latestHeight, transactionHeight + 2),
            transactionId: input.transactionId
          };
          input.onProgress?.(`Transaction located at block ${transactionHeight}. Scanning nearby records.`);
          const transactionWindowRecords = await this.scanBlockRange(transactionWindow);
          if (transactionWindowRecords.length > 0) return transactionWindowRecords;

          input.onProgress?.("Scanning merchant-owned unspent credits records near the transaction block.");
          const ownedTransactionWindowRecords = await this.scanOwnedUnspentRecords(transactionWindow);
          if (ownedTransactionWindowRecords.length > 0) return ownedTransactionWindowRecords;
        }
      }

      const anchoredWindow = {
        startBlockHeight: input.startBlockHeight,
        endBlockHeight: Math.min(latestHeight, input.startBlockHeight + this.config.scanBlockWindow),
        ...(input.transactionId ? { transactionId: input.transactionId } : {})
      };
      const trailingWindowStart = Math.max(input.startBlockHeight, latestHeight - this.config.scanBlockWindow);
      const windows =
        trailingWindowStart > anchoredWindow.endBlockHeight
          ? [
              anchoredWindow,
              {
                startBlockHeight: trailingWindowStart,
                endBlockHeight: latestHeight,
                ...(input.transactionId ? { transactionId: input.transactionId } : {})
              }
            ]
          : [anchoredWindow];

      for (const window of windows) {
        input.onProgress?.(`Scanning blocks ${window.startBlockHeight} to ${window.endBlockHeight} for merchant-owned records.`);
        const records = await this.scanBlockRange(window);
        if (records.length > 0) return records;

        input.onProgress?.("Scanning merchant-owned unspent credits records directly through the SDK.");
        const ownedRecords = await this.scanOwnedUnspentRecords(window);
        if (ownedRecords.length > 0) return ownedRecords;
      }

      await sleep(intervalMs);
    }

    throw new Error("No merchant-owned credits.aleo record was found before scanner timeout.");
  }

  async scanTransaction(transactionId: string): Promise<EncryptedRecordCandidate[]> {
    assertSafeActualTransactionId(transactionId);
    const sdk = await loadSdk();
    const networkClient = new sdk.AleoNetworkClient(TESTNET_API_HOST);
    try {
      const txObject = await networkClient.getTransactionObject(transactionId);
      return this.extractOwnedRecordsFromTransactionObject(txObject, transactionId);
    } catch {
      return [];
    }
  }

  async scanBlockRange(input: {
    startBlockHeight: number;
    endBlockHeight: number;
    transactionId?: string;
  }): Promise<EncryptedRecordCandidate[]> {
    if (input.transactionId) assertSafeActualTransactionId(input.transactionId);
    const sdk = await loadSdk();
    const networkClient = new sdk.AleoNetworkClient(TESTNET_API_HOST);
    const found: EncryptedRecordCandidate[] = [];

    try {
      for (let height = input.startBlockHeight; height <= input.endBlockHeight; height += 1) {
        const transactions = await networkClient.getTransactions(height);
        for (const tx of transactions as any[]) {
          const txId = String(tx.transaction?.id ?? tx.id ?? tx.transaction_id ?? "");
          if (input.transactionId && txId !== input.transactionId) continue;
          if (!txId || !txId.startsWith("at1")) continue;

          const txObject = await networkClient.getTransactionObject(txId);
          found.push(...(await this.extractOwnedRecordsFromTransactionObject(txObject, txId, height)));
        }
      }
    } finally {
      // No-op: transaction extraction manages account lifetime internally.
    }

    return found;
  }

  async locateTransactionHeight(input: {
    startBlockHeight: number;
    endBlockHeight: number;
    transactionId: string;
  }): Promise<number | undefined> {
    assertSafeActualTransactionId(input.transactionId);
    const sdk = await loadSdk();
    const networkClient = new sdk.AleoNetworkClient(TESTNET_API_HOST);

    for (let height = input.startBlockHeight; height <= input.endBlockHeight; height += 1) {
      const transactions = await networkClient.getTransactions(height);
      if (
        (transactions as any[]).some((tx) => {
          const txId = String(tx.transaction?.id ?? tx.id ?? tx.transaction_id ?? "");
          return txId === input.transactionId;
        })
      ) {
        return height;
      }
    }

    return undefined;
  }

  async scanOwnedUnspentRecords(input: {
    startBlockHeight: number;
    endBlockHeight: number;
    transactionId?: string;
  }): Promise<EncryptedRecordCandidate[]> {
    const sdk = await loadSdk();
    const networkClient = new sdk.AleoNetworkClient(TESTNET_API_HOST);
    const records = await networkClient.findUnspentRecords(
      input.startBlockHeight,
      input.endBlockHeight,
      [CREDITS_PROGRAM_ID],
      undefined,
      undefined,
      [],
      this.config.merchantPrivateKey
    );

    const found: EncryptedRecordCandidate[] = [];
    for (const [index, record] of records.entries()) {
      const recordPlaintext = record.toString();
      assertNoFixtureRecord(recordPlaintext);
      const owner = parseOwnerFromRecordPlaintext(recordPlaintext);
      if (owner !== this.config.merchantAddress) continue;

      found.push({
        id: createRecordId({
          recordPlaintext,
          outputIndex: index,
          ...(input.transactionId ? { transactionId: input.transactionId } : {})
        }),
        programId: CREDITS_PROGRAM_ID,
        recordName: CREDITS_RECORD_NAME,
        recordCiphertext: "",
        recordPlaintext,
        ...(input.transactionId ? { transactionId: input.transactionId } : {}),
        spent: false,
        owner,
        amountMinor: parseMicrocreditsFromRecordPlaintext(recordPlaintext)
      });
    }

    return found;
  }

  async getLatestHeight(): Promise<number> {
    const sdk = await loadSdk();
    return new sdk.AleoNetworkClient(TESTNET_API_HOST).getLatestHeight();
  }
  
  private async extractOwnedRecordsFromTransactionObject(
    txObject: unknown,
    transactionId: string,
    blockHeight?: number
  ): Promise<EncryptedRecordCandidate[]> {
    const sdk = await loadSdk();
    const merchant = new sdk.Account({ privateKey: this.config.merchantPrivateKey });
    const found: EncryptedRecordCandidate[] = [];

    try {
      const records = collectRecordCiphertexts(txObject);
      for (let index = 0; index < records.length; index += 1) {
        const recordCiphertext = records[index];
        if (!recordCiphertext || !merchant.ownsRecordCiphertext(recordCiphertext)) continue;

        const plaintext = merchant.decryptRecord(recordCiphertext).toString();
        assertNoFixtureRecord(plaintext);
        const owner = parseOwnerFromRecordPlaintext(plaintext);
        const amountMinor = parseMicrocreditsFromRecordPlaintext(plaintext);
        if (owner !== this.config.merchantAddress) continue;

        found.push({
          id: createRecordId({ recordCiphertext, transactionId, outputIndex: index }),
          programId: CREDITS_PROGRAM_ID,
          recordName: CREDITS_RECORD_NAME,
          recordCiphertext,
          transactionId,
          ...(typeof blockHeight === "number" ? { blockHeight } : {}),
          spent: false,
          owner,
          amountMinor
        });
      }
    } finally {
      merchant.destroy();
    }

    return found;
  }
}

function collectRecordCiphertexts(txObject: any): string[] {
  const candidates = new Set<string>();
  addRecordCandidates(candidates, txObject?.records?.());
  addRecordCandidates(candidates, txObject?.outputs?.(true));
  addRecordCandidates(candidates, txObject?.summary?.());
  return [...candidates];
}

function addRecordCandidates(candidates: Set<string>, value: unknown): void {
  if (typeof value === "string") {
    if (value.startsWith("record1")) candidates.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) addRecordCandidates(candidates, entry);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const nested of Object.values(value as Record<string, unknown>)) {
    addRecordCandidates(candidates, nested);
  }
}

async function loadSdk(): Promise<Sdk> {
  const sdk = await import("@provablehq/sdk/testnet.js");
  sdk.setLogLevel("silent");
  return sdk;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
