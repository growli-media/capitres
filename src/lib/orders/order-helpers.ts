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
    street?: string;
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
