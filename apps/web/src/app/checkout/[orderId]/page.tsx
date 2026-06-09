import { ShieldCheck } from "lucide-react";
import { PayButton } from "@/components/PayButton";
import { StatusPill } from "@/components/StatusPill";
import { ensureDemoOrder } from "@/lib/demo-runtime";
import { formatCurrencyAmount } from "@/lib/format";

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await ensureDemoOrder(orderId);
  const isPaid = order.status === "paid";

  return (
    <main>
      <section className="band">
        <div className="content split">
          <div>
            <div className="eyebrow">Mock UI Preview</div>
            <h1>Blueprint hoodie test order</h1>
            <p className="muted">
              This screen uses mocked adapters and mock data to preview the checkout UX. The verified testnet PoC runs
              through the CLI with real Aleo Credits transactions.
            </p>
            <div style={{ marginTop: 22 }}>
              <PayButton orderId={order.id} disabled={isPaid} />
            </div>
          </div>

          <aside className="panel stack" aria-label="Order details">
            <ShieldCheck color="var(--green)" size={28} aria-hidden="true" />
            <div>
              <h2>Payment request</h2>
              <StatusPill value={order.status} />
            </div>
            <div className="row">
              <span>Order ID</span>
              <strong className="code">{order.id}</strong>
            </div>
            <div className="row">
              <span>Amount</span>
              <strong>{formatCurrencyAmount(order.amountMinor, order.currency)}</strong>
            </div>
            <div className="row">
              <span>Merchant</span>
              <span className="code">{order.merchantId}</span>
            </div>
            <div className="row">
              <span>Reference hash</span>
              <span className="code">{order.orderReferenceHash}</span>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
