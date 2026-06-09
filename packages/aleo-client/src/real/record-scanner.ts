import type { EncryptedRecordCandidate, ScanMerchantRecordsInput } from "@aleo-checkout/shared-types";
import type { RecordScannerAdapter } from "../interfaces.js";

type AleoNetwork = "mainnet" | "testnet";

export interface ProvableRecordScannerOptions {
  network: AleoNetwork;
  scannerBaseUrl: string;
  apiKey?: string;
  consumerId?: string;
}

export class ProvableRecordScannerAdapter implements RecordScannerAdapter {
  constructor(private readonly options: ProvableRecordScannerOptions) {}

  async scanMerchantRecords(input: ScanMerchantRecordsInput): Promise<EncryptedRecordCandidate[]> {
    const sdk = await import(this.options.network === "mainnet" ? "@provablehq/sdk/mainnet.js" : "@provablehq/sdk/testnet.js");
    const scanner = new sdk.RecordScanner({ url: this.options.scannerBaseUrl });

    if (this.options.apiKey && typeof scanner.setApiKey === "function") {
      await scanner.setApiKey(this.options.apiKey);
    }

    if (this.options.consumerId && typeof scanner.setConsumerId === "function") {
      await scanner.setConsumerId(this.options.consumerId);
    }

    let uuid = input.scannerUuid;
    if (!uuid && input.merchantViewKey) {
      const viewKey =
        sdk.ViewKey && typeof sdk.ViewKey.from_string === "function"
          ? sdk.ViewKey.from_string(input.merchantViewKey)
          : input.merchantViewKey;
      const registration = await scanner.registerEncrypted(viewKey, input.startBlock ?? 0);
      uuid = registration?.data?.uuid ?? registration?.uuid;
    }

    if (!uuid) {
      throw new Error("Record scanner requires RECORD_SCANNER_UUID or MERCHANT_TEST_VIEW_KEY registration input.");
    }

    const records = await scanner.findRecords({
      uuid,
      decrypt: false,
      unspent: input.unspent ?? true,
      filter: {
        start: input.startBlock,
        program: input.programId,
        record: input.recordName
      },
      responseFilter: {
        commitment: true,
        spent: true,
        record_ciphertext: true,
        block_height: true,
        block_timestamp: true,
        output_index: true,
        record_name: true,
        function_name: true,
        program_name: true,
        transition_id: true,
        transaction_id: true
      }
    });

    return records.map((record: any, index: number) => ({
      id: String(record.commitment ?? record.id ?? `${input.programId}:${index}`),
      programId: String(record.program_name ?? input.programId),
      recordName: String(record.record_name ?? input.recordName),
      recordCiphertext: String(record.record_ciphertext ?? record.recordCiphertext ?? record.ciphertext ?? ""),
      transactionId: record.transaction_id ? String(record.transaction_id) : undefined,
      transitionId: record.transition_id ? String(record.transition_id) : undefined,
      blockHeight: typeof record.block_height === "number" ? record.block_height : undefined,
      blockTimestamp: record.block_timestamp ? String(record.block_timestamp) : undefined,
      spent: typeof record.spent === "boolean" ? record.spent : undefined
    }));
  }
}
