import { NextResponse } from "next/server";
import { ensureDemoOrder, getProgress } from "@/lib/demo-runtime";

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const order = await ensureDemoOrder(orderId);
  const progress = await getProgress(order.id);
  return NextResponse.json({ order, progress });
}
