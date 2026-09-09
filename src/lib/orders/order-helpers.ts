/**
 * Order types + pure display helpers — no "server-only", unlike store.ts
 * (which re-exports all of this). Needed as its own file because client
 * components (DashboardView.tsx, OrdersView.tsx) call customerName()/
 * customerAddress(), and "server-only" poisons an entire module for
 * client bundling even when the client only touches the parts that don't
 * actually need the server (the DB-backed orderStore itself).
 */
import type { WaylStatus } from "@/lib/payments/wayl";

export interface OrderLine {
  productSlug: string;
  title: string;
  size?: string;
  color?: string;
  qty: number;
  unitAmount: number;
  giftCard?: {
    denomination: number;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    message: string;
  };
}

/** Browser-side signals captured at checkout time (a real, cookie-bearing
 * request) so the async Wayl webhook — a server-to-server call with no
 * access to the customer's browser — can still send a well-matched Meta
 * Conversions API event once payment completes. */
export interface AdTracking {
  clientIp?: string;
  userAgent?: string;
  /** Meta's `_fbp`/`_fbc` cookies — first-party click/browser IDs. */
  fbp?: string;
  fbc?: string;
}

export interface Order {
  ref: string;
  createdAt: string;
  locale: string;
  /** "CashOnDelivery" is app-only, like "MockPaid" — Wayl never reports
   * it, since COD orders never touch Wayl at all. */
  status: WaylStatus | "MockPaid" | "CashOnDelivery";
  waylLinkId?: string;
  paymentMethod?: string | null;
  /** When the order actually got paid — set once, never overwritten
   * (see orderStore.setStatus). Wayl's own `completedAt` when we learned
   * the status by asking Wayl directly; otherwise our own clock at the
   * moment the webhook reported a paid status. */
  paidAt?: string;
  /** The capitres_vid cookie value at checkout time — links this order
   * back to its pre-purchase browsing trail (visits/visit_events) for
   * the admin Analytics section. No FK; see schema.sql's comment on
   * orders.visitor_id for why. */
  visitorId?: string;
  mock: boolean;
  customer: {
    /** Absent for orders placed via the Wayl (card) path — we no longer
     * collect anything before redirecting, to avoid asking twice for
     * what Wayl's own hosted page asks for. Backfilled asynchronously via
     * `mergeCustomer` once the Wayl webhook reports what the customer
     * told them (name/phone/city/country/address, into the legacy
     * fields below — see the webhook handler). Always present for
     * Cash on Delivery orders, collected directly on our own form. */
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    /** Always E.164 for orders placed since international checkout
     * shipped (src/components/checkout/CheckoutFlow.tsx combines the
     * dial code + number before submitting). */
    phone?: string;
    /** ISO-3166 country code. */
    country?: string;
    /** Orders placed before checkout dropped the street field — kept for
     * historical orders only, never written by new checkouts. Iraqi
     * addresses are governorate + city/district + landmark, no formal
     * street-naming convention. */
    street?: string;
    /** Nearest landmark/point of interest — the sole address-detail field
     * collected since checkout dropped street/street-number. */
    landmark?: string;
    /** Orders placed before the landmark field shipped — kept for
     * historical orders only, never written by new checkouts. */
    streetNumber?: string;
    zip?: string;
    city?: string;
    state?: string;
    /** Only set when country === "IQ". */
    governorate?: string;
    notes?: string;
    /** Orders placed before international checkout shipped — no
     * firstName/lastName/country/street split, just one name + address
     * line, Iraq implicitly. Present only on that older shape. */
    fullName?: string;
    address?: string;
  };
  lines: OrderLine[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
  promoCode?: string;
  adTracking?: AdTracking;
  metaCapiSent?: boolean;
  /** Staff-only note, never shown to the customer — see admin/(protected)/orders/NoteButton.tsx. */
  adminNote?: string;
  /** Soft-deleted from the Orders page — undefined/absent means not
   * deleted. Excluded from admin lists/aggregates but not from
   * storefront/webhook lookups (get(), setStatus()) — see store.ts. */
  deletedAt?: string;
}

/** Display name for an order's customer — handles both the current
 * split-name shape and the legacy `fullName`-only shape (orders placed
 * before international checkout shipped). */
export function customerName(c: Order["customer"]): string {
  const parts = [c.firstName, c.middleName, c.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : (c.fullName ?? "");
}

/** Compact "City, Region, Country" summary — falls back to the legacy
 * single `address` line for pre-international-checkout orders. */
export function customerAddress(c: Order["customer"]): string {
  const region = c.country === "IQ" ? c.governorate : c.state;
  const parts = [c.city, region, c.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : (c.address ?? "");
}

/** Full one-line address — every geographic field the customer entered,
 * most-specific first (street/landmark/streetNumber included, unlike
 * customerAddress() above which is just the compact city/region/country
 * summary used in list views). Falls back to the legacy `address` line. */
export function customerFullAddress(c: Order["customer"]): string {
  const region = c.country === "IQ" ? c.governorate : c.state;
  const parts = [c.street, c.streetNumber, c.landmark, c.city, region, c.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : (c.address ?? "");
}

/** Google Maps search link for the customer's address — a plain search
 * URL rather than an embedded map, so it needs no API key/billing. */
export function customerMapUrl(c: Order["customer"]): string | undefined {
  const query = customerFullAddress(c);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : undefined;
}

/** Every individual field the customer entered, labeled — lets the order
 * detail page show exactly which raw field held which value, alongside
 * the combined summary above. Skips fields absent for this order's shape
 * (Wayl orders start with just a country; legacy orders have fullName/
 * address instead of the split fields). */
export function customerFields(c: Order["customer"]): { label: string; value: string }[] {
  const regionLabel = c.country === "IQ" ? "Governorate" : "State";
  const regionValue = c.country === "IQ" ? c.governorate : c.state;
  const entries: [string, string | undefined][] = [
    ["First name", c.firstName],
    ["Middle name", c.middleName],
    ["Last name", c.lastName],
    ["Full name", c.fullName],
    ["Phone", c.phone],
    ["Email", c.email],
    ["Country", c.country],
    [regionLabel, regionValue],
    ["City", c.city],
    ["Street", c.street],
    ["Landmark", c.landmark],
    ["Street number", c.streetNumber],
    ["ZIP", c.zip],
    ["Address", c.address],
    ["Notes", c.notes],
  ];
  return entries
    .filter((e): e is [string, string] => Boolean(e[1]?.trim()))
    .map(([label, value]) => ({ label, value }));
}
