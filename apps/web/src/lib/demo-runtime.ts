import {
  MockRecordDecryptionAdapter,
  MockRecordScannerAdapter,
  MockSelectiveDisclosureAdapter,
  MockStablecoinPaymentAdapter
} from "@aleo-checkout/aleo-client";
import { CheckoutError, CheckoutService, InMemoryOrderRepository, errorCodes } from "@aleo-checkout/checkout-core";
import type {
  CheckoutOrder,
  DecryptedPaymentRecord,
  DemoProgressState,
  DisclosureArtifact,
  EncryptedRecordCandidate,
  PaymentReceipt
} from "@aleo-checkout/shared-types";

interface DemoRuntime {
  repository: InMemoryOrderRepository;
  checkout: CheckoutService;
  progress: Map<string, DemoProgressState>;
  disclosures: Map<string, DisclosureArtifact>;
}

const globalKey = Symbol.for("aleo.checkout.demoRuntime");

type RuntimeGlobal = typeof globalThis & {
  [globalKey]?: DemoRuntime;
};

export function getRuntime(): DemoRuntime {
  const runtimeGlobal = globalThis as RuntimeGlobal;
  if (!runtimeGlobal[globalKey]) {
    const repository = new InMemoryOrderRepository();
    runtimeGlobal[globalKey] = {
      repository,
      checkout: new CheckoutService(repository),
      progress: new Map<string, DemoProgressState>(),
      disclosures: new Map<string, DisclosureArtifact>()
    };
  }
  return runtimeGlobal[globalKey];
}

export async function ensureDemoOrder(orderId = "ord_demo_private_credits"): Promise<CheckoutOrder> {
  const runtime = getRuntime();
  const existing = await runtime.repository.getOrder(orderId);
  if (existing) return existing;

  const order = await runtime.checkout.createOrder({
    orderId,
    merchantId: "merchant_demo_credits",
    merchantAddress: "aleo1testmerchantcheckoutblueprint0000000000000000000000000",
    amountMinor: "1000000",
    currency: "Credits"
  });

  runtime.progress.set(order.id, {
    orderId: order.id,
    transactionSubmission: "idle",
    recordScanning: "idle",
    confirmation: "idle"
  });

  return order;
}

export async function getProgress(orderId: string): Promise<DemoProgressState> {
  await ensureDemoOrder(orderId);
  const runtime = getRuntime();
  return (
    runtime.progress.get(orderId) ?? {
      orderId,
      transactionSubmission: "idle",
      recordScanning: "idle",
      confirmation: "idle"
    }
  );
}

export async function runMockCheckoutPayment(orderId: string): Promise<{
  order: CheckoutOrder;
  receipt: PaymentReceipt;
  disclosure: DisclosureArtifact;
  progress: DemoProgressState;
}> {
  const runtime = getRuntime();
  const order = await ensureDemoOrder(orderId);
  const paymentAdapter = new MockStablecoinPaymentAdapter({
    network: "testnet",
    stablecoinProgramId: "credits.aleo"
  });

  const paymentRequestInput = {
    orderId: order.id,
    merchantAddress: order.merchantAddress,
    amountMinor: order.amountMinor,
    currency: order.currency,
    orderReferenceHash: order.orderReferenceHash,
    ...(order.expiresAt ? { expiresAt: order.expiresAt } : {})
  };
  const paymentRequest = await paymentAdapter.createPaymentRequest(paymentRequestInput);

  const submitted = await paymentAdapter.submitPrivatePayment({ paymentRequest });
  if (submitted.status === "failed") {
    await runtime.checkout.failOrder(order.id, submitted.errorMessage);
    const failedProgress: DemoProgressState = {
      orderId: order.id,
      transactionSubmission: "failed",
      recordScanning: "idle",
      confirmation: "failed",
      error: submitted.errorMessage ?? "Private payment failed."
    };
    runtime.progress.set(order.id, failedProgress);
    throw new CheckoutError(failedProgress.error ?? "Private payment failed.", errorCodes.privatePaymentFailed);
  }

  await runtime.checkout.markPaymentSubmitted(order.id, submitted.transactionId);

  const candidate: EncryptedRecordCandidate = {
    id: `mock_record_${order.id}`,
    programId: "credits.aleo",
    recordName: "credits",
    recordCiphertext: `record1mock${order.orderReferenceHash.slice(2, 18)}`,
    transactionId: submitted.transactionId,
    transitionId: `as_mock_${order.id}`,
    mocked: true
  };

  const decrypted: DecryptedPaymentRecord = {
    recordId: candidate.id,
    merchantAddress: order.merchantAddress,
    amountMinor: order.amountMinor,
    currency: order.currency,
    orderReferenceHash: order.orderReferenceHash,
    paymentTransactionId: submitted.transactionId,
    confirmationStatus: "confirmed",
    recordCiphertext: candidate.recordCiphertext,
    recordViewKey: `rvk_mock_${order.id}`,
    mocked: true
  };

  const scanner = new MockRecordScannerAdapter([candidate]);
  const decryption = new MockRecordDecryptionAdapter(new Map([[candidate.id, decrypted]]));
  const disclosureAdapter = new MockSelectiveDisclosureAdapter();

  const candidates = await scanner.scanMerchantRecords({
    merchantAddress: order.merchantAddress,
    programId: candidate.programId,
    recordName: candidate.recordName,
    unspent: true
  });

  const firstCandidate = candidates[0];
  if (!firstCandidate) {
    throw new CheckoutError("No encrypted payment record was found.", errorCodes.scannerUnavailable);
  }

  const decryptedRecord = await decryption.decryptMerchantRecord({ candidate: firstCandidate });
  const { order: paidOrder, receipt } = await runtime.checkout.confirmPaymentFromRecord({
    orderId: order.id,
    decryptedRecord
  });

  const disclosure = await disclosureAdapter.createRecordSpecificDisclosure({
    receipt,
    decryptedRecord,
    fields: ["orderReferenceHash", "merchantAddress", "amountMinor", "currency", "paymentTransactionId"]
  });

  runtime.disclosures.set(receipt.id, disclosure);

  const progress: DemoProgressState = {
    orderId: order.id,
    transactionSubmission: "submitted",
    recordScanning: "found",
    confirmation: "confirmed",
    transactionId: submitted.transactionId,
    recordCandidateId: firstCandidate.id,
    receiptId: receipt.id
  };
  runtime.progress.set(order.id, progress);

  return { order: paidOrder, receipt, disclosure, progress };
}
