import type { DecryptedPaymentRecord, EncryptedRecordCandidate } from "@aleo-checkout/shared-types";
import {
  CREDITS_PROGRAM_ID,
  CREDITS_RECORD_NAME,
  type CreditsTestnetConfig
} from "../testnet-credits/config.js";
import {
  assertNoFixtureRecord,
  createRecordId,
  parseMicrocreditsFromRecordPlaintext,
  parseOwnerFromRecordPlaintext
} from "../testnet-credits/records.js";

type Sdk = typeof import("@provablehq/sdk/testnet.js");

export class LocalMerchantCreditsDecryptor {
  constructor(private readonly config: CreditsTestnetConfig) {
    if (config.adapterMode !== "testnet-credits-local" || config.network !== "testnet") {
      throw new Error("LocalMerchantCreditsDecryptor requires testnet-credits-local mode on testnet.");
    }
  }

  async decryptMerchantRecord(candidate: EncryptedRecordCandidate): Promise<DecryptedPaymentRecord> {
    if (candidate.mocked || candidate.recordCiphertext.includes("mock") || candidate.recordCiphertext.includes("fixture")) {
      throw new Error("Mock or fixture records are forbidden in testnet mode.");
    }
    if (candidate.programId !== CREDITS_PROGRAM_ID || candidate.recordName !== CREDITS_RECORD_NAME) {
      throw new Error("Candidate is not a credits.aleo credits record.");
    }
    if (!candidate.transactionId) {
      throw new Error("Merchant record candidate is missing transaction ID.");
    }

    if (candidate.recordPlaintext) {
      assertNoFixtureRecord(candidate.recordPlaintext);
      const owner = parseOwnerFromRecordPlaintext(candidate.recordPlaintext);
      const amountMinor = parseMicrocreditsFromRecordPlaintext(candidate.recordPlaintext);
      const ownerMatchesMerchant = owner === this.config.merchantAddress;

      return {
        recordId:
          candidate.id || createRecordId({ recordPlaintext: candidate.recordPlaintext, transactionId: candidate.transactionId }),
        merchantAddress: owner,
        amountMinor,
        currency: "Credits",
        paymentTransactionId: candidate.transactionId,
        confirmationStatus: "confirmed",
        programId: CREDITS_PROGRAM_ID,
        ownerMatchesMerchant,
        ...(candidate.recordCiphertext ? { recordCiphertext: candidate.recordCiphertext } : {}),
        ...(typeof candidate.spent === "boolean" ? { spent: candidate.spent } : {})
      };
    }

    const sdk = await loadSdk();
    const merchant = new sdk.Account({ privateKey: this.config.merchantPrivateKey });
    try {
      if (!merchant.ownsRecordCiphertext(candidate.recordCiphertext)) {
        throw new Error("Merchant account does not own this record ciphertext.");
      }
      const plaintext = merchant.decryptRecord(candidate.recordCiphertext).toString();
      assertNoFixtureRecord(plaintext);
      const owner = parseOwnerFromRecordPlaintext(plaintext);
      const amountMinor = parseMicrocreditsFromRecordPlaintext(plaintext);
      const ownerMatchesMerchant = owner === this.config.merchantAddress;

      return {
        recordId: candidate.id || createRecordId({ recordCiphertext: candidate.recordCiphertext }),
        merchantAddress: owner,
        amountMinor,
        currency: "Credits",
        paymentTransactionId: candidate.transactionId,
        confirmationStatus: "confirmed",
        recordCiphertext: candidate.recordCiphertext,
        programId: CREDITS_PROGRAM_ID,
        ownerMatchesMerchant,
        ...(typeof candidate.spent === "boolean" ? { spent: candidate.spent } : {})
      };
    } finally {
      merchant.destroy();
    }
  }
}

async function loadSdk(): Promise<Sdk> {
  const sdk = await import("@provablehq/sdk/testnet.js");
  sdk.setLogLevel("silent");
  return sdk;
}
