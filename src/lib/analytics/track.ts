import { toE164Iraq } from "@/lib/phone";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GOOGLE_ADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

/** Fired on every client-side route change — gtag's own auto pageview only
 * covers the first load, so SPA navigations need this to keep GA4 session
 * / time-on-page data accurate. */
export function pageview(url: string) {
  gtag("event", "page_view", { page_path: url });
}

export interface TrackItem {
  slug: string;
  title: string;
  price: number;
  qty?: number;
}

export function trackViewContent(item: TrackItem) {
  gtag("event", "view_item", {
    currency: "IQD",
    value: item.price,
    items: [{ item_id: item.slug, item_name: item.title, price: item.price }],
  });
  fbq("track", "ViewContent", {
    content_ids: [item.slug],
    content_name: item.title,
    currency: "IQD",
    value: item.price,
  });
}

export function trackAddToCart(item: TrackItem) {
  const qty = item.qty ?? 1;
  const value = item.price * qty;
  gtag("event", "add_to_cart", {
    currency: "IQD",
    value,
    items: [{ item_id: item.slug, item_name: item.title, price: item.price, quantity: qty }],
  });
  fbq("track", "AddToCart", {
    content_ids: [item.slug],
    content_name: item.title,
    currency: "IQD",
    value,
  });
}

export function trackInitiateCheckout(items: TrackItem[], total: number) {
  gtag("event", "begin_checkout", {
    currency: "IQD",
    value: total,
    items: items.map((i) => ({
      item_id: i.slug,
      item_name: i.title,
      price: i.price,
      quantity: i.qty ?? 1,
    })),
  });
  fbq("track", "InitiateCheckout", {
    content_ids: items.map((i) => i.slug),
    currency: "IQD",
    value: total,
    num_items: items.reduce((n, i) => n + (i.qty ?? 1), 0),
  });
}

export interface TrackPurchase {
  ref: string;
  total: number;
  email?: string;
  phone?: string;
  items: TrackItem[];
}

export function trackPurchase(order: TrackPurchase) {
  // Google Ads Enhanced Conversions: gtag hashes email/phone client-side
  // before it ever leaves the browser — we just hand it the raw values.
  if (order.email || order.phone) {
    gtag("set", "user_data", {
      email: order.email,
      phone_number: order.phone ? toE164Iraq(order.phone) : undefined,
    });
  }

  gtag("event", "purchase", {
    transaction_id: order.ref,
    currency: "IQD",
    value: order.total,
    items: order.items.map((i) => ({
      item_id: i.slug,
      item_name: i.title,
      price: i.price,
      quantity: i.qty ?? 1,
    })),
  });

  if (GOOGLE_ADS_ID && GOOGLE_ADS_PURCHASE_LABEL) {
    gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      transaction_id: order.ref,
      currency: "IQD",
      value: order.total,
    });
  }

  // eventID must match the one the server sends via the Meta Conversions
  // API for this same order (see the Wayl webhook) — that's how Meta
  // dedupes a purchase seen from both the browser Pixel and the server.
  fbq(
    "track",
    "Purchase",
    { content_ids: order.items.map((i) => i.slug), currency: "IQD", value: order.total },
    { eventID: `purchase-${order.ref}` },
  );
}
