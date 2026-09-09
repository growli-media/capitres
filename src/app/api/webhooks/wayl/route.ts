import { NextRequest, NextResponse } from "next/server";
import { verifyWaylSignature, type WaylStatus } from "@/lib/payments/wayl";
import { orderStore } from "@/lib/orders/store";
import { sendMetaPurchaseEvent } from "@/lib/analytics/meta-capi";
import { PAID_STATUSES } from "@/lib/admin/queries-shared";

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
    // Wayl's webhook body uses `paymentStatus`, not `status` — that
    // field name is only used by the separate GET /links/{id} endpoint.
    paymentStatus?: WaylStatus;
    paymentMethod?: string | null;
    // Present on Wayl's hosted-checkout-collected orders — this is the
    // only place we ever learn who a card-paying customer was, since
    // checkout no longer asks for it before redirecting to Wayl.
    customer?: {
      name?: string;
      phone?: string;
      city?: string;
      country?: string;
      address?: string;
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  if (payload.referenceId && payload.paymentStatus) {
    if (payload.customer) {
      await orderStore.mergeCustomer(payload.referenceId, {
        fullName: payload.customer.name,
        phone: payload.customer.phone,
        city: payload.customer.city,
        country: payload.customer.country,
        address: payload.customer.address,
      });
    }
    const isPaid = (PAID_STATUSES as readonly string[]).includes(payload.paymentStatus);
    await orderStore.setStatus(
      payload.referenceId,
      payload.paymentStatus,
      payload.paymentMethod ?? undefined,
      // Wayl's webhook body doesn't carry its own completedAt (unlike
      // GET /links/{referenceId} — see getWaylPaymentStatus), so this is
      // our own clock at the moment we found out, not Wayl's authoritative
      // timestamp. setStatus only ever writes it once, so a later, more
      // precise sync (the confirmation-page poll or admin's "Check Wayl")
      // never overwrites it with a "more correct" value anyway.
      isPaid ? new Date().toISOString() : undefined,
    );
    // TODO(production): on "Complete", trigger gift-card email delivery
    // and the order-confirmation email from here.

    if (isPaid) {
      const claimed = await orderStore.claimForMetaCapi(payload.referenceId);
      if (claimed) await sendMetaPurchaseEvent(claimed);
    }
  }

  return NextResponse.json({ received: true });
}
