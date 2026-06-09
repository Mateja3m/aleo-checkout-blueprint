export interface DynamicAleoWalletLike {
  id?: string;
  address?: string;
  signMessage(message: string): Promise<string>;
  listOwnedRecords?(): Promise<{ records: unknown[] }>;
  proveTransaction?(input: {
    programId: string;
    functionName: string;
    inputs: string[];
    inputTypes: string[];
    broadcast: boolean;
  }): Promise<{ txId: string }>;
}

export class DynamicAleoWalletAdapter {
  constructor(private readonly wallet: DynamicAleoWalletLike) {}

  async getAddress(): Promise<string> {
    if (!this.wallet.address) {
      throw new Error("Dynamic Aleo wallet address is unavailable.");
    }
    return this.wallet.address;
  }

  async signCheckoutMessage(message: string): Promise<string> {
    return this.wallet.signMessage(message);
  }

  async listOwnedRecords(): Promise<unknown[]> {
    if (!this.wallet.listOwnedRecords) {
      throw new Error("Dynamic wallet does not expose listOwnedRecords.");
    }
    const result = await this.wallet.listOwnedRecords();
    return result.records;
  }

  async proveTransaction(input: {
    programId: string;
    functionName: string;
    inputs: string[];
    inputTypes: string[];
    broadcast?: boolean;
  }): Promise<string> {
    if (!this.wallet.proveTransaction) {
      throw new Error("Dynamic wallet does not expose proveTransaction.");
    }
    const result = await this.wallet.proveTransaction({
      ...input,
      broadcast: input.broadcast ?? true
    });
    return result.txId;
  }
}
