import type { DecryptMerchantRecordInput, DecryptedPaymentRecord } from "@aleo-checkout/shared-types";
import type { RecordDecryptionAdapter } from "../interfaces.js";

type AleoNetwork = "mainnet" | "testnet";

export class AleoSdkRecordDecryptionAdapter implements RecordDecryptionAdapter {
  constructor(private readonly network: AleoNetwork) {}

  async decryptMerchantRecord(input: DecryptMerchantRecordInput): Promise<DecryptedPaymentRecord> {
    if (!input.merchantViewKey) {
      throw new Error("Merchant view key is required to decrypt an Aleo record.");
    }

    const sdk = await import(this.network === "mainnet" ? "@provablehq/sdk/mainnet.js" : "@provablehq/sdk/testnet.js");
    const viewKey =
      sdk.ViewKey && typeof sdk.ViewKey.from_string === "function"
        ? sdk.ViewKey.from_string(input.merchantViewKey)
        : input.merchantViewKey;
    const ciphertext = sdk.RecordCiphertext.fromString(input.candidate.recordCiphertext);

    if (typeof ciphertext.isOwner === "function" && !ciphertext.isOwner(viewKey)) {
      throw new Error("Merchant view key does not own this record.");
    }

    const plaintext = ciphertext.decrypt(viewKey);
    const rawPlaintext = plaintext.toString();
    const fields = parseAleoPlaintext(rawPlaintext);
    const amountMinor = fields.amount;
    const merchantAddress = fields.owner ? stripVisibility(fields.owner) : undefined;
    const orderReferenceHash = fields.order_reference_hash ?? fields.orderReferenceHash ?? input.expectedOrderReferenceHash;

    if (!amountMinor || !merchantAddress || !orderReferenceHash) {
      throw new Error(
        "Decrypted record does not contain amount, owner, and order reference. Raw USDCx Token records are not enough for deterministic order matching."
      );
    }

    return {
      recordId: input.candidate.id,
      merchantAddress,
      amountMinor,
      currency: "USDCx",
      orderReferenceHash,
      paymentTransactionId: input.candidate.transactionId ?? input.candidate.transitionId ?? "unknown",
      confirmationStatus: "confirmed",
      recordCiphertext: input.candidate.recordCiphertext,
      rawPlaintext
    };
  }
}

export function parseAleoPlaintext(rawPlaintext: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const fieldPattern = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^,\n}]+)/g;
  for (const match of rawPlaintext.matchAll(fieldPattern)) {
    const key = match[1];
    const rawValue = match[2];
    if (key && rawValue) {
      fields[key] = stripVisibility(rawValue.trim()).replace(/u(8|16|32|64|128)$/u, "");
    }
  }
  return fields;
}

function stripVisibility(value: string): string {
  return value.replace(/\.(private|public)$/u, "");
}
