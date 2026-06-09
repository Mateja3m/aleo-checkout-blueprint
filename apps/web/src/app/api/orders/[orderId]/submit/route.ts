import { NextResponse } from "next/server";
import { CheckoutError } from "@aleo-checkout/checkout-core";
import { runMockCheckoutPayment } from "@/lib/demo-runtime";

export async function POST(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  try {
    const result = await runMockCheckoutPayment(orderId);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof CheckoutError ? 409 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed." },
      { status }
    );
  }
}
