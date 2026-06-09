import type {
  CheckoutOrder,
  CreateOrderInput,
  DecryptedPaymentRecord,
  PaymentReceipt
} from "@aleo-checkout/shared-types";
import { CheckoutError, errorCodes } from "./errors.js";
import { assertValidMinorAmount, createOrderId, createOrderReferenceHash, createReceiptId } from "./order-reference.js";
import type { OrderRepository } from "./repository.js";

export class CheckoutService {
  constructor(private readonly repository: OrderRepository) {}

  async createOrder(input: CreateOrderInput): Promise<CheckoutOrder> {
    try {
      assertValidMinorAmount(input.amountMinor);
    } catch (error) {
      throw new CheckoutError(error instanceof Error ? error.message : "Invalid amount.", errorCodes.invalidAmount);
    }

    const orderId = input.orderId ?? createOrderId();
    const order: CheckoutOrder = {
      id: orderId,
      merchantId: input.merchantId,
      merchantAddress: input.merchantAddress,
      amountMinor: input.amountMinor,
      currency: input.currency,
      orderReferenceHash: createOrderReferenceHash({
        orderId,
        merchantId: input.merchantId,
        merchantAddress: input.merchantAddress,
        amountMinor: input.amountMinor,
        currency: input.currency
      }),
      status: "pending",
      createdAt: (input.now ?? new Date()).toISOString(),
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
    };

    return this.repository.createOrder(order);
  }

  async markPaymentSubmitted(orderId: string, paymentTransactionId: string): Promise<CheckoutOrder> {
    const order = await this.requireOrder(orderId);
    if (order.status !== "pending") {
      throw new CheckoutError(`Order ${orderId} is not pending.`, errorCodes.invalidStatus);
    }

    return this.repository.updateOrder({
      ...order,
      status: "payment_submitted",
      paymentTransactionId
    });
  }

  async confirmPaymentFromRecord(input: {
    orderId?: string;
    decryptedRecord: DecryptedPaymentRecord;
    receiptId?: string;
    now?: Date;
  }): Promise<{ order: CheckoutOrder; receipt: PaymentReceipt }> {
    const order = input.orderId
      ? await this.requireOrder(input.orderId)
      : await this.findOrderByReference(
          input.decryptedRecord.orderReferenceHash ??
            (() => {
              throw new CheckoutError("No order reference was supplied.", errorCodes.referenceMismatch);
            })()
        );

    if (order.status === "paid") {
      throw new CheckoutError(`Order ${order.id} is already paid.`, errorCodes.duplicateConfirmation);
    }

    if (order.merchantAddress !== input.decryptedRecord.merchantAddress) {
      throw new CheckoutError("Decrypted record belongs to a different merchant.", errorCodes.merchantMismatch);
    }

    if (order.amountMinor !== input.decryptedRecord.amountMinor) {
      throw new CheckoutError("Decrypted record amount does not match the order.", errorCodes.amountMismatch);
    }

    if (
      !input.decryptedRecord.orderReferenceHash ||
      order.orderReferenceHash !== input.decryptedRecord.orderReferenceHash
    ) {
      throw new CheckoutError("Decrypted record reference does not match the order.", errorCodes.referenceMismatch);
    }

    const receiptId = input.receiptId ?? createReceiptId();
    if (await this.repository.hasConsumedReceipt(receiptId)) {
      throw new CheckoutError(`Receipt ${receiptId} was already consumed.`, errorCodes.consumedReceipt);
    }

    const receipt: PaymentReceipt = {
      id: receiptId,
      orderId: order.id,
      orderReferenceHash: order.orderReferenceHash,
      merchantAddress: order.merchantAddress,
      amountMinor: order.amountMinor,
      currency: order.currency,
      paymentTransactionId: input.decryptedRecord.paymentTransactionId,
      confirmationStatus: input.decryptedRecord.confirmationStatus,
      createdAt: (input.now ?? new Date()).toISOString(),
      disclosureMode: input.decryptedRecord.recordViewKey ? "record-specific" : "not-yet-supported"
    };

    await this.repository.markReceiptConsumed(receiptId);
    await this.repository.createReceipt(receipt);

    const updatedOrder = await this.repository.updateOrder({
      ...order,
      status: "paid",
      paymentTransactionId: input.decryptedRecord.paymentTransactionId,
      receiptId
    });

    return { order: updatedOrder, receipt };
  }

  async failOrder(orderId: string, reason?: string): Promise<CheckoutOrder> {
    const order = await this.requireOrder(orderId);
    void reason;
    return this.repository.updateOrder({ ...order, status: "failed" });
  }

  private async requireOrder(orderId: string): Promise<CheckoutOrder> {
    const order = await this.repository.getOrder(orderId);
    if (!order) {
      throw new CheckoutError(`Order ${orderId} was not found.`, errorCodes.orderNotFound);
    }
    return order;
  }

  private async findOrderByReference(orderReferenceHash: string): Promise<CheckoutOrder> {
    const order = await this.repository.findOrderByReferenceHash(orderReferenceHash);
    if (!order) {
      throw new CheckoutError("No order matches the decrypted payment reference.", errorCodes.orderNotFound);
    }
    return order;
  }
}
