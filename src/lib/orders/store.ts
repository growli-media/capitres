import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { WaylStatus } from "@/lib/payments/wayl";
import { sql, jsonb } from "@/lib/db/client";

/**
 * Order persistence boundary.
 *
 * `postgresOrderStore` is the production implementation. The old
 * file-based store is kept only as `fileOrderStore`, used when
 * DATABASE_URL is unset (local demos) — it must NOT be used in
 * production: Vercel's serverless functions have a read-only,
 * per-invocation filesystem, so writes to `.data/orders.json` silently
 * vanish between requests and orders would be lost.
 */

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
  status: WaylStatus | "MockPaid";
  waylLinkId?: string;
  paymentMethod?: string | null;
  mock: boolean;
  customer: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email?: string;
    /** Always E.164 for orders placed since international checkout
     * shipped (src/components/checkout/CheckoutFlow.tsx combines the
     * dial code + number before submitting). */
    phone: string;
    /** ISO-3166 country code. */
    country: string;
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

export interface OrderStore {
  create(order: Order): Promise<void>;
  get(ref: string): Promise<Order | undefined>;
  setStatus(
    ref: string,
    status: Order["status"],
    paymentMethod?: string | null,
  ): Promise<Order | undefined>;
  /** Admin dashboard: full order list, newest first. */
  list(): Promise<Order[]>;
  /** Atomically claims this order for the one-time Meta CAPI purchase
   * event — returns the order if this call is the one that should send
   * it, or undefined if it was already sent (or the order doesn't exist). */
  claimForMetaCapi(ref: string): Promise<Order | undefined>;
}

/* ------------------------------------------------------------------ */
/* Postgres implementation (production)                                */
/* ------------------------------------------------------------------ */

interface OrderRow {
  ref: string;
  created_at: string;
  locale: string;
  status: Order["status"];
  wayl_link_id: string | null;
  payment_method: string | null;
  mock: boolean;
  customer: Order["customer"];
  lines: OrderLine[];
  totals: Order["totals"];
  promo_code: string | null;
  ad_tracking: AdTracking | null;
  meta_capi_sent: boolean;
}

function toOrder(row: OrderRow): Order {
  return {
    ref: row.ref,
    createdAt: row.created_at,
    locale: row.locale,
    status: row.status,
    waylLinkId: row.wayl_link_id ?? undefined,
    paymentMethod: row.payment_method,
    mock: row.mock,
    customer: row.customer,
    lines: row.lines,
    totals: row.totals,
    promoCode: row.promo_code ?? undefined,
    adTracking: row.ad_tracking ?? undefined,
    metaCapiSent: row.meta_capi_sent,
  };
}

const postgresOrderStore: OrderStore = {
  async create(order) {
    await sql`
      insert into orders (
        ref, created_at, locale, status, wayl_link_id, payment_method,
        mock, customer, lines, totals, promo_code, ad_tracking
      ) values (
        ${order.ref}, ${order.createdAt}, ${order.locale}, ${order.status},
        ${order.waylLinkId ?? null}, ${order.paymentMethod ?? null},
        ${order.mock}, ${jsonb(order.customer)}, ${jsonb(order.lines)},
        ${jsonb(order.totals)}, ${order.promoCode ?? null},
        ${order.adTracking ? jsonb(order.adTracking) : null}
      )
    `;
  },
  async get(ref) {
    const rows = await sql<OrderRow[]>`
      select ref, created_at::text as created_at, locale, status,
             wayl_link_id, payment_method, mock, customer, lines, totals,
             promo_code, ad_tracking, meta_capi_sent
      from orders where ref = ${ref} limit 1
    `;
    return rows[0] ? toOrder(rows[0]) : undefined;
  },
  async setStatus(ref, status, paymentMethod) {
    const rows = await sql<OrderRow[]>`
      update orders
      set status = ${status},
          payment_method = coalesce(${paymentMethod ?? null}, payment_method),
          updated_at = now()
      where ref = ${ref}
      returning ref, created_at::text as created_at, locale, status,
                wayl_link_id, payment_method, mock, customer, lines, totals,
                promo_code, ad_tracking, meta_capi_sent
    `;
    return rows[0] ? toOrder(rows[0]) : undefined;
  },
  async list() {
    const rows = await sql<OrderRow[]>`
      select ref, created_at::text as created_at, locale, status,
             wayl_link_id, payment_method, mock, customer, lines, totals,
             promo_code, ad_tracking, meta_capi_sent
      from orders order by created_at desc limit 500
    `;
    return rows.map(toOrder);
  },
  async claimForMetaCapi(ref) {
    const rows = await sql<OrderRow[]>`
      update orders
      set meta_capi_sent = true
      where ref = ${ref} and meta_capi_sent = false
      returning ref, created_at::text as created_at, locale, status,
                wayl_link_id, payment_method, mock, customer, lines, totals,
                promo_code, ad_tracking, meta_capi_sent
    `;
    return rows[0] ? toOrder(rows[0]) : undefined;
  },
};

/* ------------------------------------------------------------------ */
/* File-based fallback (local demo only — NOT for production)          */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), ".data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

async function readAll(): Promise<Record<string, Order>> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    return JSON.parse(raw) as Record<string, Order>;
  } catch {
    return {};
  }
}

async function writeAll(orders: Record<string, Order>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

const fileOrderStore: OrderStore = {
  async create(order) {
    const all = await readAll();
    all[order.ref] = order;
    await writeAll(all);
  },
  async get(ref) {
    const all = await readAll();
    return all[ref];
  },
  async setStatus(ref, status, paymentMethod) {
    const all = await readAll();
    const order = all[ref];
    if (!order) return undefined;
    order.status = status;
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    await writeAll(all);
    return order;
  },
  async list() {
    const all = await readAll();
    return Object.values(all).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  },
  async claimForMetaCapi(ref) {
    const all = await readAll();
    const order = all[ref];
    if (!order || order.metaCapiSent) return undefined;
    order.metaCapiSent = true;
    await writeAll(all);
    return order;
  },
};

/** Swap this export to change order persistence. */
export const orderStore: OrderStore = process.env.DATABASE_URL
  ? postgresOrderStore
  : fileOrderStore;

export function newOrderRef(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CPT-${stamp}-${rand}`;
}
