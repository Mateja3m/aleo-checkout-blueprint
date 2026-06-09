import { describe, expect, it } from "vitest";
import {
  MockRecordScannerAdapter,
  MockSelectiveDisclosureAdapter,
  MockStablecoinPaymentAdapter
} from "@aleo-checkout/aleo-client";
import { CheckoutError, CheckoutService, InMemoryOrderRepository, errorCodes } from "@aleo-checkout/checkout-core";
import type { DecryptedPaymentRecord } from "@aleo-checkout/shared-types";

const merchantAddress = "aleo1merchanttestaddress0000000000000000000000000000000";

async function makeService() {
  const repository = new InMemoryOrderRepository();
  const service = new CheckoutService(repository);
  const order = await service.createOrder({
    orderId: "ord_test_1",
    merchantId: "merchant_test",
    merchantAddress,
    amountMinor: "12000000",
    currency: "Credits",
    now: new Date("2026-06-07T12:00:00.000Z")
  });
  return { repository, service, order };
}

function makeRecord(overrides: Partial<DecryptedPaymentRecord> = {}): DecryptedPaymentRecord {
  return {
    recordId: "record_1",
    merchantAddress,
    amountMinor: "12000000",
    currency: "Credits",
    orderReferenceHash: "placeholder",
    paymentTransactionId: "at_test_tx",
    confirmationStatus: "confirmed",
    recordCiphertext: "record1mock",
    recordViewKey: "rvk_mock",
    ...overrides
  };
}

describe("checkout core", () => {
  it("creates an order", async () => {
    const { order } = await makeService();
    expect(order.status).toBe("pending");
    expect(order.currency).toBe("Credits");
    expect(order.orderReferenceHash).toMatch(/^0x[0-9a-f]{64}$/u);
  });

  it("rejects an invalid amount", async () => {
    const service = new CheckoutService(new InMemoryOrderRepository());
    await expect(
      service.createOrder({
        merchantId: "merchant_test",
        merchantAddress,
        amountMinor: "12.50",
        currency: "Credits"
      })
    ).rejects.toMatchObject({ code: errorCodes.invalidAmount });
  });

  it("moves an order from pending to payment_submitted", async () => {
    const { service, order } = await makeService();
    const updated = await service.markPaymentSubmitted(order.id, "at_submitted");
    expect(updated.status).toBe("payment_submitted");
    expect(updated.paymentTransactionId).toBe("at_submitted");
  });

  it("matches a decrypted payment record to the correct order", async () => {
    const { service, order } = await makeService();
    await service.markPaymentSubmitted(order.id, "at_test_tx");
    const result = await service.confirmPaymentFromRecord({
      orderId: order.id,
      decryptedRecord: makeRecord({ orderReferenceHash: order.orderReferenceHash })
    });
    expect(result.order.status).toBe("paid");
    expect(result.receipt.orderId).toBe(order.id);
  });

  it("rejects a mismatched amount", async () => {
    const { service, order } = await makeService();
    await service.markPaymentSubmitted(order.id, "at_test_tx");
    await expect(
      service.confirmPaymentFromRecord({
        orderId: order.id,
        decryptedRecord: makeRecord({
          orderReferenceHash: order.orderReferenceHash,
          amountMinor: "11000000"
        })
      })
    ).rejects.toMatchObject({ code: errorCodes.amountMismatch });
  });

  it("rejects an already-consumed receipt", async () => {
    const { repository, service, order } = await makeService();
    await service.markPaymentSubmitted(order.id, "at_test_tx");
    await repository.markReceiptConsumed("rcpt_consumed");
    await expect(
      service.confirmPaymentFromRecord({
        orderId: order.id,
        receiptId: "rcpt_consumed",
        decryptedRecord: makeRecord({ orderReferenceHash: order.orderReferenceHash })
      })
    ).rejects.toMatchObject({ code: errorCodes.consumedReceipt });
  });

  it("prevents duplicate confirmation", async () => {
    const { service, order } = await makeService();
    await service.markPaymentSubmitted(order.id, "at_test_tx");
    await service.confirmPaymentFromRecord({
      orderId: order.id,
      decryptedRecord: makeRecord({ orderReferenceHash: order.orderReferenceHash })
    });

    await expect(
      service.confirmPaymentFromRecord({
        orderId: order.id,
        decryptedRecord: makeRecord({ orderReferenceHash: order.orderReferenceHash })
      })
    ).rejects.toMatchObject({ code: errorCodes.duplicateConfirmation });
  });

  it("generates a record-specific disclosure artifact where supported", async () => {
    const { service, order } = await makeService();
    await service.markPaymentSubmitted(order.id, "at_test_tx");
    const decryptedRecord = makeRecord({ orderReferenceHash: order.orderReferenceHash });
    const { receipt } = await service.confirmPaymentFromRecord({ orderId: order.id, decryptedRecord });
    const disclosure = await new MockSelectiveDisclosureAdapter().createRecordSpecificDisclosure({
      receipt,
      decryptedRecord,
      fields: ["orderReferenceHash", "amountMinor", "paymentTransactionId"]
    });
    expect(disclosure.mode).toBe("record-specific");
    expect(disclosure.accountViewKeyDisclosed).toBe(false);
  });

  it("handles an unavailable record scanner", async () => {
    const scanner = new MockRecordScannerAdapter([], { unavailable: true });
    await expect(
      scanner.scanMerchantRecords({
        merchantAddress,
        programId: "credits.aleo",
        recordName: "credits"
      })
    ).rejects.toThrow("unavailable");
  });

  it("handles a failed private payment", async () => {
    const { order } = await makeService();
    const adapter = new MockStablecoinPaymentAdapter({ failSubmit: true });
    const paymentRequest = await adapter.createPaymentRequest({
      orderId: order.id,
      merchantAddress: order.merchantAddress,
      amountMinor: order.amountMinor,
      currency: order.currency,
      orderReferenceHash: order.orderReferenceHash
    });
    const submitted = await adapter.submitPrivatePayment({ paymentRequest });
    expect(submitted.status).toBe("failed");
    expect(() => {
      if (submitted.status === "failed") {
        throw new CheckoutError(submitted.errorMessage ?? "failed", errorCodes.privatePaymentFailed);
      }
    }).toThrowError(CheckoutError);
  });
});
