/** First-party visit beacon — separate from src/lib/analytics/track.ts
 * (which fires GA4/Meta Pixel events). No "server-only": called directly
 * from client components. */
export type VisitEventType = "page_view" | "product_view" | "add_to_cart";

export function trackVisitEvent(type: VisitEventType, opts: { path?: string; productSlug?: string } = {}) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      path: opts.path ?? window.location.pathname,
      productSlug: opts.productSlug,
      referrer: document.referrer || null,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    }),
    keepalive: true,
  }).catch(() => {});
}
