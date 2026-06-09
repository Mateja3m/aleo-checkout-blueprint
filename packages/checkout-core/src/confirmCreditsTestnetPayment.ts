import type {
  CreditsTestnetConfirmationInput,
  CreditsTestnetConfirmationResult
} from "@aleo-checkout/shared-types";
import { CheckoutError, errorCodes } from "./errors.js";
import { createReceiptId } from "./order-reference.js";

const TX_ID_PATTERN = /^at1[023456789acdefghjklmnpqrstuvwxyz]+$/u;

export function confirmCreditsTestnetPayment(
  input: CreditsTestnetConfirmationInput
): CreditsTestnetConfirmationResult {
  if (input.orderCurrency !== "Credits" || input.currency !== "Credits") {
    throw new CheckoutError("Credits testnet confirmation only accepts Credits payments.", errorCodes.invalidProgram);
  }

  if (input.programId !== "credits.aleo") {
    throw new CheckoutError("Payment record is not from credits.aleo.", errorCodes.invalidProgram);
  }

  if (!TX_ID_PATTERN.test(input.paymentTransactionId)) {
    throw new CheckoutError("Payment transaction ID is missing or invalid.", errorCodes.invalidTransactionId);
  }

  if (input.orderStatus === "paid" || input.existingReceiptId) {
    throw new CheckoutError("Order already has a receipt.", errorCodes.duplicateConfirmation);
  }

  if (input.orderStatus !== "payment_submitted" && input.orderStatus !== "pending") {
    throw new CheckoutError("Order is not confirmable.", errorCodes.invalidStatus);
  }

  const now = input.now ?? new Date();
  if (input.orderExpiresAt && Date.parse(input.orderExpiresAt) <= now.getTime()) {
    throw new CheckoutError("Order is expired.", errorCodes.expiredOrder);
  }

  if (input.orderMerchantAddress !== input.merchantAddress) {
    throw new CheckoutError("Payment record belongs to a different merchant.", errorCodes.merchantMismatch);
  }

  if (!input.ownerMatchesMerchant) {
    throw new CheckoutError("Record is not owned by the expected merchant.", errorCodes.recordNotOwned);
  }

  if (input.orderAmountMinor !== input.amountMinor) {
    throw new CheckoutError("Credits amount does not match the order.", errorCodes.amountMismatch);
  }

  if (!input.recordId || input.consumedRecordIds.has(input.recordId)) {
    throw new CheckoutError("Merchant record was already consumed.", errorCodes.consumedRecord);
  }

  return {
    status: "verified",
    receiptId: createReceiptId(),
    consumedRecordId: input.recordId,
    confirmedAt: now.toISOString(),
    correlationMode: "documented-off-chain-poc-correlation"
  };
}
