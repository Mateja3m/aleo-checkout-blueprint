import Link from "next/link";
import { ReceiptText } from "lucide-react";
import type { CheckoutOrder } from "@aleo-checkout/shared-types";
import { StatusPill } from "@/components/StatusPill";
import { ensureDemoOrder, getRuntime } from "@/lib/demo-runtime";
import { formatCurrencyAmount } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MerchantOrdersPage() {
  await ensureDemoOrder();
  const runtime = getRuntime();
  const orders = await runtime.repository.listOrders();
  const pending = orders.filter((order) => order.status !== "paid");
  const paid = orders.filter((order) => order.status === "paid");

  return (
    <main>
      <section className="band">
        <div className="content stack">
          <div>
            <div className="eyebrow">Merchant console</div>
            <h1>Orders</h1>
          </div>

          <section className="stack">
            <h2>Pending orders</h2>
            <div className="grid">
              {pending.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
              {pending.length === 0 ? <p className="muted">No pending orders.</p> : null}
            </div>
          </section>

          <section className="stack">
            <h2>Paid orders</h2>
            <div className="grid">
              {paid.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
              {paid.length === 0 ? <p className="muted">No paid orders yet.</p> : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function OrderRow({ order }: { order: CheckoutOrder }) {
  return (
    <article className="order-row">
      <div className="order-row-header">
        <strong className="code">{order.id}</strong>
        <StatusPill value={order.status} />
      </div>
      <div className="key-value">
        <span>{formatCurrencyAmount(order.amountMinor, order.currency)}</span>
        <span className="code muted">{order.paymentTransactionId ?? "No transaction yet"}</span>
      </div>
      <div className="nav">
        <Link className="button" href={`/checkout/${order.id}`}>Checkout</Link>
        <Link className="button" href={`/progress/${order.id}`}>Progress</Link>
        {order.receiptId ? (
          <Link className="button primary" href={`/receipt/${order.receiptId}`}>
            <ReceiptText size={16} aria-hidden="true" />
            Receipt
          </Link>
        ) : null}
      </div>
    </article>
  );
}
