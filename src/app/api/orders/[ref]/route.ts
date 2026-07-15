import { NextRequest, NextResponse } from "next/server";
import { orderStore } from "@/lib/orders/store";
import { getWaylPaymentStatus } from "@/lib/payments/wayl";

/**
 * Public order-status endpoint used by the confirmation page.
 * Returns only non-sensitive fields. In live mode it lazily syncs the
 * status from Wayl, so the confirmation page works even if the webhook
 * hasn't arrived yet.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const order = await orderStore.get(ref);
  if (!order) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  if (!order.mock && !["Complete", "Delivered"].includes(order.status)) {
    const remote = await getWaylPaymentStatus(ref);
    if (remote && remote.status !== order.status) {
      await orderStore.setStatus(ref, remote.status, remote.paymentMethod);
      order.status = remote.status;
      order.paymentMethod = remote.paymentMethod;
    }
  }

  return NextResponse.json({
    ref: order.ref,
    status: order.status,
    mock: order.mock,
    email: order.customer.email,
    phone: order.customer.phone,
    totals: order.totals,
    lines: order.lines.map((l) => ({
      productSlug: l.productSlug,
      title: l.title,
      size: l.size,
      qty: l.qty,
      unitAmount: l.unitAmount,
      isGiftCard: Boolean(l.giftCard),
    })),
    hasGiftCards: order.lines.some((l) => l.giftCard),
  });
}
