import type {
  CreatePaymentRequestInput,
  PaymentRequest,
  SubmitPrivatePaymentInput,
  SubmittedPayment
} from "@aleo-checkout/shared-types";
import type { StablecoinPaymentAdapter } from "../interfaces.js";

export interface AleoStablecoinPaymentOptions {
  network: "testnet" | "mainnet";
  stablecoinProgramId: string;
}

export class AleoStablecoinPaymentAdapter implements StablecoinPaymentAdapter {
  constructor(private readonly options: AleoStablecoinPaymentOptions) {}

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
      network: this.options.network,
      stablecoinProgramId: this.options.stablecoinProgramId,
      memo: [
        "Private USDCx payment request.",
        "Raw USDCx transfer does not encode this order reference.",
        `orderReferenceHash=${input.orderReferenceHash}`
      ].join(" ")
    };
  }

  async submitPrivatePayment(_input: SubmitPrivatePaymentInput): Promise<SubmittedPayment> {
    throw new Error(
      "Real private USDCx submission requires wallet/DPS credentials, token records, fee funding, and freeze-list proofs. Use Dynamic or the documented testnet flow."
    );
  }
}
