import type {
  CreatePaymentRequestInput,
  CreateRecordDisclosureInput,
  DecryptMerchantRecordInput,
  DecryptedPaymentRecord,
  DisclosureArtifact,
  EncryptedRecordCandidate,
  PaymentRequest,
  ScanMerchantRecordsInput,
  SubmitPrivatePaymentInput,
  SubmittedPayment
} from "@aleo-checkout/shared-types";

export interface StablecoinPaymentAdapter {
  createPaymentRequest(input: CreatePaymentRequestInput): Promise<PaymentRequest>;
  submitPrivatePayment(input: SubmitPrivatePaymentInput): Promise<SubmittedPayment>;
}

export interface RecordScannerAdapter {
  scanMerchantRecords(input: ScanMerchantRecordsInput): Promise<EncryptedRecordCandidate[]>;
}

export interface RecordDecryptionAdapter {
  decryptMerchantRecord(input: DecryptMerchantRecordInput): Promise<DecryptedPaymentRecord>;
}

export interface SelectiveDisclosureAdapter {
  createRecordSpecificDisclosure(input: CreateRecordDisclosureInput): Promise<DisclosureArtifact>;
}
