import { NextResponse } from "next/server";
import { ensureDemoOrder, getRuntime } from "@/lib/demo-runtime";

export async function GET() {
  await ensureDemoOrder();
  const runtime = getRuntime();
  return NextResponse.json({ orders: await runtime.repository.listOrders() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    merchantId?: string;
    merchantAddress?: string;
    amountMinor?: string;
  };
  const runtime = getRuntime();
  const order = await runtime.checkout.createOrder({
    merchantId: body.merchantId ?? "merchant_demo_credits",
    merchantAddress: body.merchantAddress ?? "aleo1testmerchantcheckoutblueprint0000000000000000000000000",
    amountMinor: body.amountMinor ?? "1000000",
    currency: "Credits"
  });
  return NextResponse.json({ order }, { status: 201 });
}
