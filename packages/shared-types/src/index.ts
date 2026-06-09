export type OrderStatus =
  | "pending"
  | "payment_submitted"
  | "paid"
  | "failed"
  | "expired";

export type Currency = "Credits" | "USDCx";

export interface CheckoutOrder {
  id: string;
  merchantId: string;
  merchantAddress: string;
  amountMinor: string;
  currency: Currency;
  orderReferenceHash: string;
  status: OrderStatus;
  createdAt: string;
  expiresAt?: string;
  paymentTransactionId?: string;
  receiptId?: string;
}

export interface PaymentReceipt {
  id: string;
  orderId: string;
  orderReferenceHash: string;
  merchantAddress: string;
  amountMinor: string;
  currency: Currency;
  paymentTransactionId: string;
  confirmationStatus: "pending" | "confirmed" | "failed";
  createdAt: string;
  disclosureMode:
    | "merchant-only"
    | "record-specific"
    | "transition-specific"
    | "not-yet-supported";
}

export interface CreateOrderInput {
  merchantId: string;
  merchantAddress: string;
  amountMinor: string;
  currency: Currency;
  orderId?: string;
  expiresAt?: string;
  now?: Date;
}

export interface CreatePaymentRequestInput {
  orderId: string;
  merchantAddress: string;
  amountMinor: string;
  currency: Currency;
  orderReferenceHash: string;
  expiresAt?: string;
}

export interface PaymentRequest {
  id: string;
  orderId: string;
  merchantAddress: string;
  amountMinor: string;
  currency: Currency;
  orderReferenceHash: string;
  createdAt: string;
  expiresAt?: string;
  network: "testnet" | "mainnet" | "local";
  stablecoinProgramId: string;
  memo: string;
}

export interface SubmitPrivatePaymentInput {
  paymentRequest: PaymentRequest;
  customerAddress?: string;
  tokenRecordPlaintext?: string;
  merkleProofs?: string;
}

export interface SubmittedPayment {
  transactionId: string;
  orderId: string;
  status: "submitted" | "failed";
  submittedAt: string;
  errorMessage?: string;
  mocked: boolean;
  startBlockHeight?: number;
  transferType?: "private" | "publicToPrivate";
}

export interface ScanMerchantRecordsInput {
  merchantAddress: string;
  programId: string;
  recordName: string;
  unspent?: boolean;
  startBlock?: number;
  scannerUuid?: string;
  merchantViewKey?: string;
}

export interface EncryptedRecordCandidate {
  id: string;
  programId: string;
  recordName: string;
  recordCiphertext: string;
  recordPlaintext?: string;
  transactionId?: string;
  transitionId?: string;
  blockHeight?: number;
  blockTimestamp?: string;
  spent?: boolean;
  mocked?: boolean;
  owner?: string;
  amountMinor?: string;
}

export interface DecryptMerchantRecordInput {
  candidate: EncryptedRecordCandidate;
  merchantViewKey?: string;
  expectedOrderReferenceHash?: string;
}

export interface DecryptedPaymentRecord {
  recordId: string;
  merchantAddress: string;
  amountMinor: string;
  currency: Currency;
  orderReferenceHash?: string;
  paymentTransactionId: string;
  confirmationStatus: "pending" | "confirmed" | "failed";
  recordCiphertext?: string;
  recordViewKey?: string;
  rawPlaintext?: string;
  mocked?: boolean;
  programId?: string;
  ownerMatchesMerchant?: boolean;
  spent?: boolean;
}

export interface CreditsTestnetConfirmationInput {
  orderId: string;
  orderMerchantAddress: string;
  orderAmountMinor: string;
  orderCurrency: "Credits";
  orderStatus: OrderStatus;
  orderExpiresAt?: string;
  merchantAddress: string;
  amountMinor: string;
  currency: Currency;
  programId: string;
  recordId: string;
  paymentTransactionId: string;
  ownerMatchesMerchant: boolean;
  consumedRecordIds: ReadonlySet<string>;
  existingReceiptId?: string;
  now?: Date;
}

export interface CreditsTestnetConfirmationResult {
  status: "verified";
  receiptId: string;
  consumedRecordId: string;
  confirmedAt: string;
  correlationMode: "documented-off-chain-poc-correlation";
}

export interface CreateRecordDisclosureInput {
  receipt: PaymentReceipt;
  decryptedRecord: DecryptedPaymentRecord;
  fields: Array<"orderReferenceHash" | "merchantAddress" | "amountMinor" | "currency" | "paymentTransactionId">;
  merchantViewKey?: string;
}

export interface DisclosureArtifact {
  id: string;
  receiptId: string;
  mode: PaymentReceipt["disclosureMode"];
  scope: "single-record" | "transition" | "merchant-account" | "unsupported";
  disclosedFields: Record<string, string>;
  recordCiphertext?: string;
  recordViewKey?: string;
  createdAt: string;
  accountViewKeyDisclosed: false;
  notice: string;
  mocked?: boolean;
}

export interface DemoProgressState {
  orderId: string;
  transactionSubmission: "idle" | "submitted" | "failed";
  recordScanning: "idle" | "found" | "unavailable" | "failed";
  confirmation: "idle" | "pending" | "confirmed" | "failed";
  error?: string;
  transactionId?: string;
  recordCandidateId?: string;
  receiptId?: string;
}
