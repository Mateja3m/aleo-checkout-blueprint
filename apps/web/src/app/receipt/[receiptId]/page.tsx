import { notFound } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";
import { ensureDemoOrder, getRuntime } from "@/lib/demo-runtime";
import { formatCurrencyAmount } from "@/lib/format";

export default async function ReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  await ensureDemoOrder();
  const runtime = getRuntime();
  const receipt = await runtime.repository.getReceipt(receiptId);
  if (!receipt) notFound();
  const disclosure = runtime.disclosures.get(receipt.id);

  return (
    <main>
      <section className="band white">
        <div className="content split">
          <div className="stack">
            <div>
              <div className="eyebrow">Mock UI Preview</div>
              <h1>{receipt.id}</h1>
              <p className="muted">This receipt preview is mocked. Real receipt evidence is recorded in the CLI artifact and evidence docs.</p>
              <StatusPill value={receipt.confirmationStatus} />
            </div>

            <div className="panel stack">
              <div className="row">
                <span>Order ID</span>
                <strong className="code">{receipt.orderId}</strong>
              </div>
              <div className="row">
                <span>Amount</span>
                <strong>{formatCurrencyAmount(receipt.amountMinor, receipt.currency)}</strong>
              </div>
              <div className="row">
                <span>Transaction ID</span>
                <span className="code">{receipt.paymentTransactionId}</span>
              </div>
              <div className="row">
                <span>Disclosure scope</span>
                <span>{disclosure?.scope ?? "unsupported"}</span>
              </div>
            </div>
          </div>

          <aside className="panel stack">
            <h2>Disclosed fields</h2>
            {disclosure ? (
              Object.entries(disclosure.disclosedFields).map(([key, value]) => (
                <div className="row" key={key}>
                  <span>{key}</span>
                  <span className="code">{value}</span>
                </div>
              ))
            ) : (
              <p className="muted">No disclosure artifact is available.</p>
            )}
            <div className="notice">
              {disclosure?.notice ??
                "Account-level activity is not being disclosed. Transition-level selective disclosure is not yet supported in this PoC."}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
