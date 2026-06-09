import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { ensureDemoOrder, getProgress } from "@/lib/demo-runtime";

export default async function ProgressPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await ensureDemoOrder(orderId);
  const progress = await getProgress(order.id);

  return (
    <main>
      <section className="band">
        <div className="content stack">
          <div>
            <div className="eyebrow">Mock UI Preview</div>
            <h1>Order {order.id}</h1>
            <p className="muted">This progress view is mocked. Real testnet status is verified with the CLI PoC commands.</p>
            <StatusPill value={order.status} />
          </div>

          {progress.error ? <div className="notice">{progress.error}</div> : null}

          <div className="grid">
            <div className="panel stack">
              <h2>Transaction submission</h2>
              <StatusPill value={progress.transactionSubmission} />
              <span className="code muted">{progress.transactionId ?? "No transaction submitted yet"}</span>
            </div>
            <div className="panel stack">
              <h2>Record scanning</h2>
              <StatusPill value={progress.recordScanning} />
              <span className="code muted">{progress.recordCandidateId ?? "Waiting for scanner result"}</span>
            </div>
            <div className="panel stack">
              <h2>Confirmation</h2>
              <StatusPill value={progress.confirmation} />
              <span className="code muted">{progress.receiptId ?? "Receipt not generated yet"}</span>
            </div>
          </div>

          <div className="nav">
            <Link className="button" href={`/progress/${order.id}`}>
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </Link>
            <Link className="button" href="/merchant/orders">Merchant orders</Link>
            {progress.receiptId ? <Link className="button primary" href={`/receipt/${progress.receiptId}`}>View receipt</Link> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
