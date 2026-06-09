import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LocalCreditsPaymentAdapter,
  LocalCreditsRecordScanner,
  LocalMerchantCreditsDecryptor,
  MockStablecoinPaymentAdapter,
  assertNoFixtureRecord,
  assertSafeActualTransactionId,
  loadCreditsTestnetConfig
} from "@aleo-checkout/aleo-client";
import { CheckoutError, confirmCreditsTestnetPayment, errorCodes } from "@aleo-checkout/checkout-core";

const originalEnv = { ...process.env };

const validEnv = {
  ALEO_ADAPTER_MODE: "testnet-credits-local",
  ALEO_NETWORK: "testnet",
  ALEO_CUSTOMER_PRIVATE_KEY: "TEST_ONLY_CUSTOMER_PRIVATE_KEY",
  ALEO_CUSTOMER_VIEW_KEY: "TEST_ONLY_CUSTOMER_VIEW_KEY",
  ALEO_CUSTOMER_ADDRESS: "aleo1customer0000000000000000000000000000000000000000000000",
  ALEO_MERCHANT_PRIVATE_KEY: "TEST_ONLY_MERCHANT_PRIVATE_KEY",
  ALEO_MERCHANT_VIEW_KEY: "TEST_ONLY_MERCHANT_VIEW_KEY",
  ALEO_MERCHANT_ADDRESS: "aleo1merchant0000000000000000000000000000000000000000000000",
  ALEO_SCAN_BLOCK_WINDOW: "3",
  ALEO_PAYMENT_AMOUNT_MICROCREDITS: "1000000"
};

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

function confirmation(overrides: Partial<Parameters<typeof confirmCreditsTestnetPayment>[0]> = {}) {
  return confirmCreditsTestnetPayment({
    orderId: "ord_testnet_credits",
    orderMerchantAddress: validEnv.ALEO_MERCHANT_ADDRESS,
    orderAmountMinor: "1000000",
    orderCurrency: "Credits",
    orderStatus: "payment_submitted",
    merchantAddress: validEnv.ALEO_MERCHANT_ADDRESS,
    amountMinor: "1000000",
    currency: "Credits",
    programId: "credits.aleo",
    recordId: "credits_record_actual",
    paymentTransactionId: "at1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    ownerMatchesMerchant: true,
    consumedRecordIds: new Set(),
    now: new Date("2026-06-09T10:00:00.000Z"),
    ...overrides
  });
}

describe("Credits testnet safety", () => {
  it("testnet mode refuses mock adapter initialization", () => {
    process.env.ALEO_ADAPTER_MODE = "testnet-credits-local";
    expect(() => new MockStablecoinPaymentAdapter()).toThrow("Mock adapters");
  });

  it("mock mode remains functional for UI development", async () => {
    process.env.ALEO_ADAPTER_MODE = "mock";
    const adapter = new MockStablecoinPaymentAdapter();
    const request = await adapter.createPaymentRequest({
      orderId: "ord_mock",
      merchantAddress: validEnv.ALEO_MERCHANT_ADDRESS,
      amountMinor: "1000000",
      currency: "Credits",
      orderReferenceHash: "0xabc"
    });
    const submitted = await adapter.submitPrivatePayment({ paymentRequest: request });
    expect(submitted.mocked).toBe(true);
  });

  it("missing env variables fail fast", () => {
    expect(() => loadCreditsTestnetConfig({ ALEO_ADAPTER_MODE: "testnet-credits-local", ALEO_NETWORK: "testnet" })).toThrow(
      "ALEO_CUSTOMER_PRIVATE_KEY"
    );
  });

  it("fake transaction IDs are rejected", () => {
    expect(() => assertSafeActualTransactionId("at_mock_ord")).toThrow("actual Aleo transaction");
  });

  it("fixture records are rejected in testnet mode", () => {
    expect(() => assertNoFixtureRecord("{ owner: aleo1x.private, microcredits: 1u64.private, _nonce: fixture }")).toThrow(
      "fixture"
    );
  });

  it("wrong merchant fails", () => {
    expect(() => confirmation({ merchantAddress: "aleo1other000000000000000000000000000000000000000000000000" })).toThrowError(
      CheckoutError
    );
    expect(() => confirmation({ merchantAddress: "aleo1other000000000000000000000000000000000000000000000000" })).toThrow(
      "different merchant"
    );
  });

  it("wrong amount fails", () => {
    expect(() => confirmation({ amountMinor: "999999" })).toThrow("amount");
  });

  it("wrong program fails", () => {
    expect(() => confirmation({ programId: "test_usdcx_stablecoin.aleo" })).toThrow("credits.aleo");
  });

  it("already consumed record fails", () => {
    expect(() => confirmation({ consumedRecordIds: new Set(["credits_record_actual"]) })).toThrow("already consumed");
  });

  it("duplicate confirmation fails", () => {
    expect(() => confirmation({ orderStatus: "paid", existingReceiptId: "rcpt_existing" })).toThrow("already has");
  });

  it("artifact shape is redacted", () => {
    const result = confirmation();
    const artifact = {
      status: result.status,
      adapterMode: "testnet-credits-local",
      network: "testnet",
      programId: "credits.aleo",
      transactionId: "at1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      orderId: "ord_testnet_credits",
      receiptId: result.receiptId,
      correlationMode: result.correlationMode,
      recordDiscovered: true,
      recordDecrypted: true,
      amountValidated: true,
      duplicateConfirmationRejected: true,
      confirmedAt: result.confirmedAt
    };
    expect(JSON.stringify(artifact)).not.toMatch(/PrivateKey|ViewKey|record1|plaintext/u);
  });

  it("scanner timeout fails safely", async () => {
    const scanner = Object.create(LocalCreditsRecordScanner.prototype) as LocalCreditsRecordScanner & {
      config: { scanBlockWindow: number };
      scanOwnedUnspentRecords: () => Promise<[]>;
    };
    scanner.config = { scanBlockWindow: 3 };
    vi.spyOn(scanner, "getLatestHeight").mockResolvedValue(20);
    vi.spyOn(scanner, "scanBlockRange").mockResolvedValue([]);
    scanner.scanOwnedUnspentRecords = async () => [];
    await expect(
      scanner.scanMerchantRecords({ startBlockHeight: 1, timeoutMs: 1, intervalMs: 1 })
    ).rejects.toThrow("No merchant-owned");
  });

  it("no merchant record fails safely", async () => {
    const scanner = Object.create(LocalCreditsRecordScanner.prototype) as LocalCreditsRecordScanner & {
      config: { scanBlockWindow: number };
      scanOwnedUnspentRecords: () => Promise<[]>;
    };
    scanner.config = { scanBlockWindow: 3 };
    vi.spyOn(scanner, "getLatestHeight").mockResolvedValue(10);
    vi.spyOn(scanner, "scanBlockRange").mockResolvedValue([]);
    scanner.scanOwnedUnspentRecords = async () => [];
    await expect(scanner.scanMerchantRecords({ startBlockHeight: 1, timeoutMs: 5, intervalMs: 1 })).rejects.toThrow(
      "No merchant-owned"
    );
  });

  it("merchant decryptor accepts plaintext candidates from local SDK scanning", async () => {
    const decryptor = new LocalMerchantCreditsDecryptor({
      adapterMode: "testnet-credits-local",
      network: "testnet",
      customerPrivateKey: validEnv.ALEO_CUSTOMER_PRIVATE_KEY,
      customerViewKey: validEnv.ALEO_CUSTOMER_VIEW_KEY,
      customerAddress: validEnv.ALEO_CUSTOMER_ADDRESS,
      merchantPrivateKey: validEnv.ALEO_MERCHANT_PRIVATE_KEY,
      merchantViewKey: validEnv.ALEO_MERCHANT_VIEW_KEY,
      merchantAddress: validEnv.ALEO_MERCHANT_ADDRESS,
      scanBlockWindow: 3,
      paymentAmountMicrocredits: 1000000
    });

    const decrypted = await decryptor.decryptMerchantRecord({
      id: "credits_record_plaintext",
      programId: "credits.aleo",
      recordName: "credits",
      recordCiphertext: "",
      recordPlaintext:
        "{ owner: aleo1merchant0000000000000000000000000000000000000000000000.private, microcredits: 1000000u64.private, _nonce: 1group.public }",
      transactionId: "at1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"
    });

    expect(decrypted.amountMinor).toBe("1000000");
    expect(decrypted.ownerMatchesMerchant).toBe(true);
    expect(decrypted.paymentTransactionId).toMatch(/^at1/u);
  });

  it("local proving failure is surfaced", async () => {
    const adapter = Object.create(LocalCreditsPaymentAdapter.prototype) as LocalCreditsPaymentAdapter & {
      ensurePrivateCreditsRecordWithOptions: () => Promise<{ recordPlaintext: string }>;
      createClient: () => Promise<any>;
      config: { paymentAmountMicrocredits: number; merchantAddress: string; scanBlockWindow: number };
    };
    adapter.config = {
      paymentAmountMicrocredits: 1000000,
      merchantAddress: validEnv.ALEO_MERCHANT_ADDRESS,
      scanBlockWindow: 3
    };
    adapter.ensurePrivateCreditsRecordWithOptions = async () => ({
      recordPlaintext:
        "{ owner: aleo1customer0000000000000000000000000000000000000000000000.private, microcredits: 1000000u64.private, _nonce: 1group.public }"
    });
    adapter.createClient = async () => ({
      networkClient: { getLatestHeight: async () => 1 },
      programManager: { buildTransferTransaction: async () => { throw new Error("local proving failed"); } }
    });
    await expect(adapter.submitPrivateCreditsTransfer()).rejects.toThrow("local proving failed");
  });

  it("transaction rejection is surfaced", async () => {
    const adapter = Object.create(LocalCreditsPaymentAdapter.prototype) as LocalCreditsPaymentAdapter & {
      createClient: () => Promise<any>;
      getTransactionStatus: () => Promise<any>;
    };
    adapter.createClient = async () => ({ networkClient: {} });
    adapter.getTransactionStatus = async () => ({
      transactionId: "at1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      status: "rejected"
    });
    await expect(
      adapter.pollAcceptedTransaction("at1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", {
        timeoutMs: 5,
        intervalMs: 1
      })
    ).rejects.toThrow("rejected");
  });

  it("lists recent private credits records without amount-specific SDK lookup", async () => {
    const adapter = Object.create(LocalCreditsPaymentAdapter.prototype) as LocalCreditsPaymentAdapter & {
      createClient: () => Promise<any>;
      config: { customerPrivateKey: string; customerAddress: string; scanBlockWindow: number };
    };
    adapter.config = {
      customerPrivateKey: validEnv.ALEO_CUSTOMER_PRIVATE_KEY,
      customerAddress: validEnv.ALEO_CUSTOMER_ADDRESS,
      scanBlockWindow: 3
    };
    const findUnspentRecords = vi.fn(async () => [
      {
        toString: () =>
          "{ owner: aleo1customer0000000000000000000000000000000000000000000000.private, microcredits: 1000000u64.private, _nonce: 1group.public }",
        owner: () => ({ toString: () => validEnv.ALEO_CUSTOMER_ADDRESS })
      }
    ]);
    adapter.createClient = async () => ({
      account: { destroy: () => undefined },
      networkClient: {
        getLatestHeight: async () => 100,
        findUnspentRecords
      }
    });

    const records = await adapter.listCustomerCreditRecords();

    expect(findUnspentRecords).toHaveBeenCalledWith(
      97,
      100,
      ["credits.aleo"],
      undefined,
      undefined,
      [],
      validEnv.ALEO_CUSTOMER_PRIVATE_KEY
    );
    expect(records).toHaveLength(1);
    expect(records[0]?.amountMicrocredits).toBe("1000000");
    expect(records[0]?.owner).toBe(validEnv.ALEO_CUSTOMER_ADDRESS);
  });
});
