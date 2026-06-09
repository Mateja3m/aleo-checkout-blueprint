import type { CheckoutOrder } from "@aleo-checkout/shared-types";

export function formatUsdcxMinor(amountMinor: string): string {
  const amount = BigInt(amountMinor);
  const whole = amount / 1_000_000n;
  const fractional = amount % 1_000_000n;
  const cents = (fractional / 10_000n).toString().padStart(2, "0");
  return `$${whole.toString()}.${cents} USDCx`;
}

export function formatCreditsMicrocredits(amountMinor: string): string {
  const amount = BigInt(amountMinor);
  const whole = amount / 1_000_000n;
  const fractional = (amount % 1_000_000n).toString().padStart(6, "0");
  return `${whole.toString()}.${fractional} Credits`;
}

export function formatCurrencyAmount(amountMinor: string, currency: "Credits" | "USDCx"): string {
  return currency === "Credits" ? formatCreditsMicrocredits(amountMinor) : formatUsdcxMinor(amountMinor);
}

export function statusLabel(status: CheckoutOrder["status"]): string {
  return status.replace("_", " ");
}
