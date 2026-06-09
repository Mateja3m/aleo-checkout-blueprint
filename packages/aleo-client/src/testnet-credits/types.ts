export interface CreditsRecordSummary {
  recordId: string;
  programId: "credits.aleo";
  recordName: "credits";
  owner: string;
  amountMicrocredits: string;
  transactionId?: string;
  transitionId?: string;
  blockHeight?: number;
  spent?: boolean;
  recordCiphertext?: string;
  recordPlaintext?: string;
}

export interface CreditsTransferResult {
  transactionId: string;
  startBlockHeight: number;
  amountMicrocredits: string;
  merchantAddress: string;
}

export interface CreditsTransactionStatus {
  transactionId: string;
  status: "accepted" | "not_found" | "rejected" | "unknown";
  blockHeight?: number;
  rawStatus?: string;
}
