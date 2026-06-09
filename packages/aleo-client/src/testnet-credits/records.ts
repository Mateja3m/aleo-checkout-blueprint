import { createHash } from "node:crypto";

export function microcreditsToCredits(microcredits: number): number {
  return microcredits / 1_000_000;
}

export function parseMicrocreditsFromRecordPlaintext(recordPlaintext: string): string {
  const match = /microcredits:\s*([0-9]+)u64\.private/u.exec(recordPlaintext);
  if (!match?.[1]) {
    throw new Error("Unable to parse microcredits from credits record plaintext.");
  }
  return match[1];
}

export function parseOwnerFromRecordPlaintext(recordPlaintext: string): string {
  const match = /owner:\s*(aleo1[023456789acdefghjklmnpqrstuvwxyz]+)\.private/u.exec(recordPlaintext);
  if (!match?.[1]) {
    throw new Error("Unable to parse owner from credits record plaintext.");
  }
  return match[1];
}

export function parseNonceFromRecordPlaintext(recordPlaintext: string): string | undefined {
  const match = /_nonce:\s*([^,\s}]+)/u.exec(recordPlaintext);
  return match?.[1];
}

export function createRecordId(input: {
  recordCiphertext?: string;
  recordPlaintext?: string;
  transactionId?: string;
  outputIndex?: number;
}): string {
  const material = [
    input.transactionId ?? "unknown-tx",
    input.outputIndex?.toString() ?? "unknown-output",
    input.recordCiphertext ?? input.recordPlaintext ?? "unknown-record"
  ].join(":");
  return `credits_record_${createHash("sha256").update(material).digest("hex").slice(0, 24)}`;
}

export function assertSafeActualTransactionId(transactionId: string): void {
  if (!/^at1[023456789acdefghjklmnpqrstuvwxyz]+$/u.test(transactionId)) {
    throw new Error("Expected an actual Aleo transaction id beginning with at1.");
  }
  if (transactionId.includes("mock") || transactionId.includes("fixture")) {
    throw new Error("Mock or fixture transaction IDs are forbidden in testnet mode.");
  }
}

export function assertNoFixtureRecord(record: string): void {
  const lowered = record.toLowerCase();
  if (lowered.includes("mock") || lowered.includes("fixture")) {
    throw new Error("Mock or fixture records are forbidden in testnet mode.");
  }
}
