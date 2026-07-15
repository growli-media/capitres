import { NextRequest, NextResponse } from "next/server";
import { verifyWaylSignature, type WaylStatus } from "@/lib/payments/wayl";
import { orderStore } from "@/lib/orders/store";
import { sendMetaPurchaseEvent } from "@/lib/analytics/meta-capi";

const PAID_STATUSES: WaylStatus[] = ["Complete", "Delivered"];

/**
 * Wayl webhook receiver.
 *
 * Wayl signs the raw request body with HMAC-SHA256 using the merchant's
 * webhookSecret and sends the hex digest in `x-wayl-signature-256`.
 * Signature must be verified on the RAW body before parsing; respond 2xx
 * once the event is safely stored.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-wayl-signature-256");

  if (!verifyWaylSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid-signature" }, { status: 401 });
  }

  let payload: {
    referenceId?: string;
    status?: WaylStatus;
    paymentMethod?: string | null;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  if (payload.referenceId && payload.status) {
    await orderStore.setStatus(
      payload.referenceId,
      payload.status,
      payload.paymentMethod ?? undefined,
    );
    // TODO(production): on "Complete", trigger gift-card email delivery
    // and the order-confirmation email from here.

    if (PAID_STATUSES.includes(payload.status)) {
      const claimed = await orderStore.claimForMetaCapi(payload.referenceId);
      if (claimed) await sendMetaPurchaseEvent(claimed);
    }
  }

  return NextResponse.json({ received: true });
}
