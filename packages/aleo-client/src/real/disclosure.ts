import type { CreateRecordDisclosureInput, DisclosureArtifact } from "@aleo-checkout/shared-types";
import type { SelectiveDisclosureAdapter } from "../interfaces.js";

type AleoNetwork = "mainnet" | "testnet";

export class AleoSdkSelectiveDisclosureAdapter implements SelectiveDisclosureAdapter {
  constructor(private readonly network: AleoNetwork) {}

  async createRecordSpecificDisclosure(input: CreateRecordDisclosureInput): Promise<DisclosureArtifact> {
    if (!input.merchantViewKey || !input.decryptedRecord.recordCiphertext) {
      throw new Error("Record-specific disclosure requires merchant view key and record ciphertext.");
    }

    const sdk = await import(this.network === "mainnet" ? "@provablehq/sdk/mainnet.js" : "@provablehq/sdk/testnet.js");
    const viewKey =
      sdk.ViewKey && typeof sdk.ViewKey.from_string === "function"
        ? sdk.ViewKey.from_string(input.merchantViewKey)
        : input.merchantViewKey;
    const ciphertext = sdk.RecordCiphertext.fromString(input.decryptedRecord.recordCiphertext);
    const recordViewKey =
      typeof ciphertext.recordViewKey === "function"
        ? ciphertext.recordViewKey(viewKey)
        : sdk.EncryptionToolkit.generateRecordViewKey(viewKey, ciphertext);

    const disclosedFields: Record<string, string> = {};
    for (const field of input.fields) {
      disclosedFields[field] = String(input.decryptedRecord[field]);
    }

    return {
      id: `disc_${input.receipt.id}`,
      receiptId: input.receipt.id,
      mode: "record-specific",
      scope: "single-record",
      disclosedFields,
      recordCiphertext: input.decryptedRecord.recordCiphertext,
      recordViewKey: recordViewKey.toString(),
      createdAt: new Date().toISOString(),
      accountViewKeyDisclosed: false,
      notice: "This artifact discloses only the selected payment record via a record view key. It does not disclose the merchant account view key or account-level activity."
    };
  }
}
