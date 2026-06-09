export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export const errorCodes = {
  invalidAmount: "invalid_amount",
  orderNotFound: "order_not_found",
  invalidStatus: "invalid_status",
  amountMismatch: "amount_mismatch",
  merchantMismatch: "merchant_mismatch",
  referenceMismatch: "reference_mismatch",
  duplicateConfirmation: "duplicate_confirmation",
  consumedReceipt: "consumed_receipt",
  consumedRecord: "consumed_record",
  scannerUnavailable: "scanner_unavailable",
  privatePaymentFailed: "private_payment_failed",
  invalidProgram: "invalid_program",
  invalidTransactionId: "invalid_transaction_id",
  recordNotOwned: "record_not_owned",
  expiredOrder: "expired_order",
  unsafeMockInTestnet: "unsafe_mock_in_testnet",
  scannerTimeout: "scanner_timeout",
  recordNotFound: "record_not_found",
  localProvingFailed: "local_proving_failed",
  transactionRejected: "transaction_rejected"
} as const;
