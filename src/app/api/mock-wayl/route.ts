import { NextRequest, NextResponse } from "next/server";
import { isWaylMockMode } from "@/lib/payments/wayl";
import { orderStore } from "@/lib/orders/store";

/**
 * Local stand-in for Wayl's hosted checkout completing a payment.
 * Only callable while the app runs in mock mode (no WAYL_API_TOKEN),
 * and only for orders that were created as mock orders.
 */
export async function POST(request: NextRequest) {
  if (!isWaylMockMode()) {
    return NextResponse.json({ error: "not-in-mock-mode" }, { status: 403 });
  }

  const { ref, outcome } = (await request.json().catch(() => ({}))) as {
    ref?: string;
    outcome?: "complete" | "cancel";
  };
  if (!ref || !outcome) {
    return NextResponse.json({ error: "invalid-input" }, { status: 400 });
  }

  const order = await orderStore.get(ref);
  if (!order || !order.mock) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const updated = await orderStore.setStatus(
    ref,
    outcome === "complete" ? "Complete" : "Cancelled",
    outcome === "complete" ? "MockWallet" : null,
  );

  return NextResponse.json({ ref, status: updated?.status });
}
