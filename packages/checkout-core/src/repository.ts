import type { CheckoutOrder, PaymentReceipt } from "@aleo-checkout/shared-types";

export interface OrderRepository {
  createOrder(order: CheckoutOrder): Promise<CheckoutOrder>;
  updateOrder(order: CheckoutOrder): Promise<CheckoutOrder>;
  getOrder(orderId: string): Promise<CheckoutOrder | undefined>;
  listOrders(): Promise<CheckoutOrder[]>;
  findOrderByReferenceHash(orderReferenceHash: string): Promise<CheckoutOrder | undefined>;
  createReceipt(receipt: PaymentReceipt): Promise<PaymentReceipt>;
  getReceipt(receiptId: string): Promise<PaymentReceipt | undefined>;
  listReceipts(): Promise<PaymentReceipt[]>;
  hasConsumedReceipt(receiptId: string): Promise<boolean>;
  markReceiptConsumed(receiptId: string): Promise<void>;
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, CheckoutOrder>();
  private readonly receipts = new Map<string, PaymentReceipt>();
  private readonly consumedReceiptIds = new Set<string>();

  async createOrder(order: CheckoutOrder): Promise<CheckoutOrder> {
    this.orders.set(order.id, { ...order });
    return { ...order };
  }

  async updateOrder(order: CheckoutOrder): Promise<CheckoutOrder> {
    this.orders.set(order.id, { ...order });
    return { ...order };
  }

  async getOrder(orderId: string): Promise<CheckoutOrder | undefined> {
    const order = this.orders.get(orderId);
    return order ? { ...order } : undefined;
  }

  async listOrders(): Promise<CheckoutOrder[]> {
    return [...this.orders.values()].map((order) => ({ ...order }));
  }

  async findOrderByReferenceHash(orderReferenceHash: string): Promise<CheckoutOrder | undefined> {
    const order = [...this.orders.values()].find(
      (candidate) => candidate.orderReferenceHash === orderReferenceHash
    );
    return order ? { ...order } : undefined;
  }

  async createReceipt(receipt: PaymentReceipt): Promise<PaymentReceipt> {
    this.receipts.set(receipt.id, { ...receipt });
    return { ...receipt };
  }

  async getReceipt(receiptId: string): Promise<PaymentReceipt | undefined> {
    const receipt = this.receipts.get(receiptId);
    return receipt ? { ...receipt } : undefined;
  }

  async listReceipts(): Promise<PaymentReceipt[]> {
    return [...this.receipts.values()].map((receipt) => ({ ...receipt }));
  }

  async hasConsumedReceipt(receiptId: string): Promise<boolean> {
    return this.consumedReceiptIds.has(receiptId);
  }

  async markReceiptConsumed(receiptId: string): Promise<void> {
    this.consumedReceiptIds.add(receiptId);
  }
}
