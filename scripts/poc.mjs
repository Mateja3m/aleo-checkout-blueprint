#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  LocalCreditsPaymentAdapter,
  LocalCreditsRecordScanner,
  LocalMerchantCreditsDecryptor,
  loadCreditsTestnetConfig,
  redactEnvPresence,
  redactAddress,
  redactTransactionId
} from "../packages/aleo-client/dist/index.js";
import {
  CheckoutError,
  InMemoryOrderRepository,
  CheckoutService,
  confirmCreditsTestnetPayment
} from "../packages/checkout-core/dist/index.js";

const cwd = process.cwd();
const statePath = resolve(cwd, "artifacts/testnet-credits-state.json");
const privateCandidatePath = resolve(cwd, "artifacts/private/merchant-record-candidate.json");
const privateDecryptedPath = resolve(cwd, "artifacts/private/decrypted-merchant-record.json");
const resultPath = resolve(cwd, "artifacts/testnet-credits-poc-result.json");

loadDotEnvLocal();

const command = process.argv[2] ?? "help";

try {
  switch (command) {
    case "validate-env":
      await validateEnv();
      break;
    case "check-credits":
      await checkCredits();
      break;
    case "create-private-credits-record":
      await createPrivateCreditsRecord();
      break;
    case "list-customer-credit-records":
      await listCustomerCreditRecords();
      break;
    case "transfer-private-credits":
      await transferPrivateCredits();
      break;
    case "transaction-status":
      await transactionStatus(process.argv[3]);
      break;
    case "scan-merchant-local":
      await scanMerchantLocal();
      break;
    case "decrypt-merchant-record":
      await decryptMerchantRecord();
      break;
    case "confirm-order":
      await confirmOrder();
      break;
    case "testnet-credits":
      await runEndToEnd();
      break;
    default:
      printJson({
        commands: [
          "validate-env",
          "check-credits",
          "create-private-credits-record",
          "list-customer-credit-records",
          "transfer-private-credits",
          "transaction-status",
          "scan-merchant-local",
          "decrypt-merchant-record",
          "confirm-order",
          "testnet-credits"
        ]
      });
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  printJson({ status: "failed", error: message });
  process.exitCode = 1;
}

await exitCli(process.exitCode ?? 0);

async function validateEnv() {
  const config = loadCreditsTestnetConfig();
  const adapter = new LocalCreditsPaymentAdapter(config);
  const accounts = await adapter.validateAccounts();
  printJson({
    status: "ok",
    adapterMode: config.adapterMode,
    network: config.network,
    env: redactEnvPresence(config),
    accounts
  });
}

async function checkCredits() {
  const config = loadCreditsTestnetConfig();
  const adapter = new LocalCreditsPaymentAdapter(config);
  await adapter.validateAccounts();
  const customerPublicBalanceMicrocredits = await adapter.getPublicCreditsBalanceMicrocredits(config.customerAddress);
  const merchantPublicBalanceMicrocredits = await adapter.getPublicCreditsBalanceMicrocredits(config.merchantAddress);
  if (customerPublicBalanceMicrocredits < config.paymentAmountMicrocredits) {
    throw new Error(
      "Customer public Credits balance is below ALEO_PAYMENT_AMOUNT_MICROCREDITS. Fund ALEO_CUSTOMER_ADDRESS from the official Aleo testnet faucet before running the PoC."
    );
  }
  printJson({
    status: "ok",
    customerAddress: redactAddress(config.customerAddress),
    merchantAddress: redactAddress(config.merchantAddress),
    customerPublicBalanceMicrocredits,
    merchantPublicBalanceMicrocredits,
    requiredPaymentAmountMicrocredits: config.paymentAmountMicrocredits
  });
}

async function createPrivateCreditsRecord() {
  const config = loadCreditsTestnetConfig();
  const adapter = new LocalCreditsPaymentAdapter(config);
  const result = await adapter.createPrivateCreditsRecord();
  await adapter.pollAcceptedTransaction(result.transactionId);
  writeState({ privateRecordCreation: result });
  printJson({
    status: "submitted",
    transition: "credits.aleo/transfer_public_to_private",
    transactionId: result.transactionId,
    startBlockHeight: result.startBlockHeight,
    amountMicrocredits: result.amountMicrocredits
  });
}

async function listCustomerCreditRecords() {
  const config = loadCreditsTestnetConfig();
  const adapter = new LocalCreditsPaymentAdapter(config);
  const state = readState();
  const records = await adapter.listCustomerCreditRecords(
    typeof state.privateRecordCreation?.startBlockHeight === "number"
      ? { startHeight: Math.max(0, state.privateRecordCreation.startBlockHeight - 1) }
      : {}
  );
  printJson({
    status: "ok",
    count: records.length,
    records: records.map((record) => ({
      recordId: record.recordId,
      programId: record.programId,
      recordName: record.recordName,
      owner: redactAddress(record.owner),
      amountMicrocredits: record.amountMicrocredits,
      spent: record.spent ?? false
    }))
  });
}

async function transferPrivateCredits() {
  const config = loadCreditsTestnetConfig();
  const adapter = new LocalCreditsPaymentAdapter(config);
  const state = readState();
  const result = await adapter.submitPrivateCreditsTransfer({
    orderId: "ord_testnet_credits",
    onProgress: printProgress,
    ...(typeof state.privateRecordCreation?.startBlockHeight === "number"
      ? { recordSearchStartHeight: Math.max(0, state.privateRecordCreation.startBlockHeight - 1) }
      : {})
  });
  writeState({ transfer: result });
  printJson({
    status: result.status,
    transition: "credits.aleo/transfer_private",
    transactionId: result.transactionId,
    startBlockHeight: result.startBlockHeight,
    amountMicrocredits: result.amountMicrocredits,
    merchantAddress: redactAddress(result.merchantAddress)
  });
}

async function transactionStatus(txArg) {
  const config = loadCreditsTestnetConfig();
  const state = readState();
  const txId = txArg ?? state.transfer?.transactionId ?? state.privateRecordCreation?.transactionId;
  if (!txId) throw new Error("No transaction ID provided and none found in artifact state.");
  const adapter = new LocalCreditsPaymentAdapter(config);
  const status = await adapter.getTransactionStatus(txId);
  printJson(status);
}

async function scanMerchantLocal() {
  const config = loadCreditsTestnetConfig();
  const state = readState();
  if (!state.transfer?.transactionId || typeof state.transfer.startBlockHeight !== "number") {
    throw new Error("Run transfer-private-credits before scan-merchant-local.");
  }
  const scanner = new LocalCreditsRecordScanner(config);
  const records = await scanner.scanMerchantRecords({
    startBlockHeight: state.transfer.startBlockHeight,
    transactionId: state.transfer.transactionId,
    onProgress: printProgress
  });
  const first = records[0];
  if (!first) throw new Error("No merchant record found.");
  writePrivateJson(privateCandidatePath, first);
  writeState({
    ...state,
    merchantScan: {
      recordId: first.id,
      transactionId: first.transactionId,
      blockHeight: first.blockHeight,
      amountMinor: first.amountMinor,
      recordDiscovered: true
    }
  });
  printJson({
    status: "found",
    count: records.length,
    recordId: first.id,
    transactionId: first.transactionId,
    blockHeight: first.blockHeight,
    amountMinor: first.amountMinor
  });
}

async function decryptMerchantRecord() {
  const config = loadCreditsTestnetConfig();
  if (!existsSync(privateCandidatePath)) {
    throw new Error("Run scan-merchant-local before decrypt-merchant-record.");
  }
  const candidate = JSON.parse(readFileSync(privateCandidatePath, "utf8"));
  const decryptor = new LocalMerchantCreditsDecryptor(config);
  const decrypted = await decryptor.decryptMerchantRecord(candidate);
  writePrivateJson(privateDecryptedPath, decrypted);
  const state = readState();
  writeState({
    ...state,
    merchantDecryption: {
      recordId: decrypted.recordId,
      transactionId: decrypted.paymentTransactionId,
      amountMinor: decrypted.amountMinor,
      ownerMatchesMerchant: decrypted.ownerMatchesMerchant,
      recordDecrypted: true
    }
  });
  printJson({
    status: "decrypted",
    recordId: decrypted.recordId,
    programId: decrypted.programId,
    ownerMatchesMerchant: decrypted.ownerMatchesMerchant,
    amountMinor: decrypted.amountMinor,
    transactionId: decrypted.paymentTransactionId
  });
}

async function confirmOrder() {
  const config = loadCreditsTestnetConfig();
  if (!existsSync(privateDecryptedPath)) {
    throw new Error("Run decrypt-merchant-record before confirm-order.");
  }
  const decrypted = JSON.parse(readFileSync(privateDecryptedPath, "utf8"));
  const state = readState();
  const confirmedAt = new Date();
  const confirmation = confirmCreditsTestnetPayment({
    orderId: "ord_testnet_credits",
    orderMerchantAddress: config.merchantAddress,
    orderAmountMinor: String(config.paymentAmountMicrocredits),
    orderCurrency: "Credits",
    orderStatus: "payment_submitted",
    merchantAddress: decrypted.merchantAddress,
    amountMinor: decrypted.amountMinor,
    currency: decrypted.currency,
    programId: decrypted.programId,
    recordId: decrypted.recordId,
    paymentTransactionId: decrypted.paymentTransactionId,
    ownerMatchesMerchant: decrypted.ownerMatchesMerchant === true,
    consumedRecordIds: new Set(),
    now: confirmedAt
  });

  let duplicateRejected = false;
  try {
    confirmCreditsTestnetPayment({
      orderId: "ord_testnet_credits",
      orderMerchantAddress: config.merchantAddress,
      orderAmountMinor: String(config.paymentAmountMicrocredits),
      orderCurrency: "Credits",
      orderStatus: "paid",
      existingReceiptId: confirmation.receiptId,
      merchantAddress: decrypted.merchantAddress,
      amountMinor: decrypted.amountMinor,
      currency: decrypted.currency,
      programId: decrypted.programId,
      recordId: decrypted.recordId,
      paymentTransactionId: decrypted.paymentTransactionId,
      ownerMatchesMerchant: decrypted.ownerMatchesMerchant === true,
      consumedRecordIds: new Set([decrypted.recordId]),
      now: confirmedAt
    });
  } catch {
    duplicateRejected = true;
  }

  const result = {
    status: "verified",
    adapterMode: "testnet-credits-local",
    network: "testnet",
    programId: "credits.aleo",
    transactionId: decrypted.paymentTransactionId,
    orderId: "ord_testnet_credits",
    receiptId: confirmation.receiptId,
    correlationMode: confirmation.correlationMode,
    recordDiscovered: state.merchantScan?.recordDiscovered === true,
    recordDecrypted: true,
    amountValidated: decrypted.amountMinor === String(config.paymentAmountMicrocredits),
    duplicateConfirmationRejected: duplicateRejected,
    confirmedAt: confirmation.confirmedAt
  };
  writePublicJson(resultPath, result);
  writeState({ ...state, confirmation: result });
  printJson(result);
}

async function runEndToEnd() {
  await validateEnv();
  await checkCredits();
  await transferPrivateCredits();
  const state = readState();
  const config = loadCreditsTestnetConfig();
  const adapter = new LocalCreditsPaymentAdapter(config);
  await adapter.pollAcceptedTransaction(state.transfer.transactionId);
  await scanMerchantLocal();
  await decryptMerchantRecord();
  await confirmOrder();
}

function loadDotEnvLocal() {
  const path = resolve(cwd, ".env.local");
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/u);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function readState() {
  if (!existsSync(statePath)) return {};
  return JSON.parse(readFileSync(statePath, "utf8"));
}

function writeState(next) {
  writePublicJson(statePath, { ...readState(), ...next });
}

function writePublicJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function writePrivateJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function printJson(data) {
  const redacted = JSON.stringify(data, (key, value) => {
    if (/privateKey|viewKey|recordCiphertext|recordPlaintext|seed|apiKey|jwt/iu.test(key)) return "[redacted]";
    if (key === "transactionId" && typeof value === "string") return value;
    if (key === "merchantAddress" && typeof value === "string") return redactAddress(value);
    if (key === "customerAddress" && typeof value === "string") return redactAddress(value);
    return value;
  }, 2);
  console.log(redacted);
}

function printProgress(message) {
  process.stderr.write(`[poc] ${message}\n`);
}

async function exitCli(code) {
  await new Promise((resolve) => process.stdout.write("", resolve));
  await new Promise((resolve) => process.stderr.write("", resolve));
  process.exit(code);
}
