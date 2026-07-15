import "server-only";
import crypto from "node:crypto";
import { toE164Iraq } from "@/lib/phone";
import type { AdTracking, Order } from "@/lib/orders/store";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Server-side mirror of the browser Pixel's Purchase event, sent from the
 * Wayl webhook once payment actually confirms. This matters because
 * client-only Pixel tracking silently loses a meaningful share of
 * conversions to ad blockers and iOS's tracking restrictions — the
 * Conversions API reports the same purchase straight from our server,
 * which Meta then dedupes against the browser event via a shared
 * `event_id` (see `trackPurchase` in lib/analytics/track.ts).
 *
 * No-ops quietly if META_CAPI_ACCESS_TOKEN isn't configured, so this is
 * safe to call unconditionally.
 */
export async function sendMetaPurchaseEvent(order: Order): Promise<void> {
  if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) return;

  const ad: AdTracking = order.adTracking ?? {};
  const userData: Record<string, unknown> = {
    em: [sha256(order.customer.email)],
    ph: [sha256(toE164Iraq(order.customer.phone).replace("+", ""))],
  };
  if (ad.clientIp) userData.client_ip_address = ad.clientIp;
  if (ad.userAgent) userData.client_user_agent = ad.userAgent;
  if (ad.fbp) userData.fbp = ad.fbp;
  if (ad.fbc) userData.fbc = ad.fbc;

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.parse(order.createdAt) / 1000) || Math.floor(Date.now() / 1000),
        event_id: `purchase-${order.ref}`,
        action_source: "website",
        event_source_url: SITE_URL
          ? `${SITE_URL}/${order.locale}/checkout/confirmation?ref=${order.ref}`
          : undefined,
        user_data: userData,
        custom_data: {
          currency: "IQD",
          value: order.totals.total,
          contents: order.lines.map((l) => ({
            id: l.productSlug,
            quantity: l.qty,
            item_price: l.unitAmount,
          })),
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("[meta-capi] send failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[meta-capi] request error:", err);
  }
}
