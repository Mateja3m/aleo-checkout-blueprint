import { createHash, randomUUID } from "node:crypto";

export function createOrderId(): string {
  return `ord_${randomUUID().replaceAll("-", "").slice(0, 18)}`;
}

export function createReceiptId(): string {
  return `rcpt_${randomUUID().replaceAll("-", "").slice(0, 18)}`;
}

export function createOrderReferenceHash(input: {
  orderId: string;
  merchantId: string;
  merchantAddress: string;
  amountMinor: string;
  currency: string;
}): string {
  const payload = [
    input.orderId,
    input.merchantId,
    input.merchantAddress,
    input.amountMinor,
    input.currency
  ].join("|");

  return `0x${createHash("sha256").update(payload).digest("hex")}`;
}

export function assertValidMinorAmount(amountMinor: string): void {
  if (!/^[0-9]+$/.test(amountMinor)) {
    throw new Error("Amount must be a positive integer string in minor units.");
  }

  if (BigInt(amountMinor) <= 0n) {
    throw new Error("Amount must be greater than zero.");
  }
}
