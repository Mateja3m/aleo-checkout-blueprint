import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aleo Private Payments Checkout Blueprint",
  description: "Technical PoC for private Credits checkout on Aleo testnet."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const modeLabel =
    process.env.ALEO_ADAPTER_MODE === "testnet-credits-local"
      ? "ALEO TESTNET — VERIFIED CREDITS MODE"
      : "MOCK UI PREVIEW — NO REAL ALEO TRANSACTIONS";
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="brand">
              <strong>Aleo Private Payments Checkout Blueprint</strong>
              <span>{modeLabel}</span>
            </div>
            <nav className="nav" aria-label="Mock UI preview navigation">
              <Link href="/checkout/ord_demo_private_credits">Checkout</Link>
              <Link href="/progress/ord_demo_private_credits">Progress</Link>
              <Link href="/merchant/orders">Merchant Orders</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
