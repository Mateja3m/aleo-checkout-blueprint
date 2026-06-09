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
import type {
  RecordDecryptionAdapter,
  RecordScannerAdapter,
  SelectiveDisclosureAdapter,
  StablecoinPaymentAdapter
} from "./interfaces.js";
import { validateMockMode } from "./testnet-credits/config.js";

export class MockStablecoinPaymentAdapter implements StablecoinPaymentAdapter {
  constructor(
    private readonly options: {
      failSubmit?: boolean;
      network?: "testnet" | "mainnet" | "local";
      stablecoinProgramId?: string;
    } = {}
  ) {
    validateMockMode();
  }

  async createPaymentRequest(input: CreatePaymentRequestInput): Promise<PaymentRequest> {
    return {
      id: `payreq_${input.orderId}`,
      orderId: input.orderId,
      merchantAddress: input.merchantAddress,
      amountMinor: input.amountMinor,
      currency: input.currency,
      orderReferenceHash: input.orderReferenceHash,
      createdAt: new Date().toISOString(),
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      network: this.options.network ?? "local",
      stablecoinProgramId: this.options.stablecoinProgramId ?? "mock_credits.aleo",
      memo: `Mock private ${input.currency} request for order ${input.orderId}`
    };
  }

  async submitPrivatePayment(input: SubmitPrivatePaymentInput): Promise<SubmittedPayment> {
    if (this.options.failSubmit) {
      return {
        transactionId: "mock_failed_tx",
        orderId: input.paymentRequest.orderId,
        status: "failed",
        submittedAt: new Date().toISOString(),
        errorMessage: "Mock private payment failed before broadcast.",
        mocked: true
      };
    }

    return {
      transactionId: `at_mock_${input.paymentRequest.orderId}`,
      orderId: input.paymentRequest.orderId,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      mocked: true
    };
  }
}

export class MockRecordScannerAdapter implements RecordScannerAdapter {
  constructor(
    private readonly candidates: EncryptedRecordCandidate[],
    private readonly options: { unavailable?: boolean } = {}
  ) {
    validateMockMode();
  }

  async scanMerchantRecords(_input: ScanMerchantRecordsInput): Promise<EncryptedRecordCandidate[]> {
    if (this.options.unavailable) {
      throw new Error("Mock record scanner unavailable.");
    }
    return this.candidates.map((candidate) => ({ ...candidate, mocked: true }));
  }
}

export class MockRecordDecryptionAdapter implements RecordDecryptionAdapter {
  constructor(private readonly recordsByCandidateId: Map<string, DecryptedPaymentRecord>) {
    validateMockMode();
  }

  async decryptMerchantRecord(input: DecryptMerchantRecordInput): Promise<DecryptedPaymentRecord> {
    const record = this.recordsByCandidateId.get(input.candidate.id);
    if (!record) {
      throw new Error(`No mock decrypted record for ${input.candidate.id}.`);
    }

    return {
      ...record,
      recordCiphertext: input.candidate.recordCiphertext,
      mocked: true
    };
  }
}

export class MockSelectiveDisclosureAdapter implements SelectiveDisclosureAdapter {
  constructor() {
    validateMockMode();
  }
  async createRecordSpecificDisclosure(input: CreateRecordDisclosureInput): Promise<DisclosureArtifact> {
    const disclosedFields: Record<string, string> = {};
    for (const field of input.fields) {
      const value = input.decryptedRecord[field];
      disclosedFields[field] = String(value);
    }

    return {
      id: `disc_${input.receipt.id}`,
      receiptId: input.receipt.id,
      mode: "record-specific",
      scope: "single-record",
      disclosedFields,
      recordCiphertext: input.decryptedRecord.recordCiphertext ?? "mock_record_ciphertext",
      recordViewKey: input.decryptedRecord.recordViewKey ?? "mock_record_view_key",
      createdAt: new Date().toISOString(),
      accountViewKeyDisclosed: false,
      notice: "Mock artifact: only the selected payment record is disclosed; account-level activity is not disclosed.",
      mocked: true
    };
  }
}
