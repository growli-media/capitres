import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { sql, jsonb } from "@/lib/db/client";
import type { Order, OrderLine, AdTracking } from "./order-helpers";

/**
 * Order persistence boundary.
 *
 * `postgresOrderStore` is the production implementation. The old
 * file-based store is kept only as `fileOrderStore`, used when
 * DATABASE_URL is unset (local demos) — it must NOT be used in
 * production: Vercel's serverless functions have a read-only,
 * per-invocation filesystem, so writes to `.data/orders.json` silently
 * vanish between requests and orders would be lost.
 *
 * Types (Order, OrderLine, AdTracking) and the pure customerName()/
 * customerAddress() display helpers live in ./order-helpers instead of
 * here — that file has no "server-only", so client components can still
 * import them without pulling this DB-backed module (and its "fs"/
 * "postgres" imports) into the browser bundle. Re-exported below so
 * every existing `from "@/lib/orders/store"` import keeps working.
 */
export type { Order, OrderLine, AdTracking } from "./order-helpers";
export { customerName, customerAddress } from "./order-helpers";

export interface OrderStore {
  create(order: Order): Promise<void>;
  get(ref: string): Promise<Order | undefined>;
  setStatus(
    ref: string,
    status: Order["status"],
    paymentMethod?: string | null,
  ): Promise<Order | undefined>;
  /** Shallow-merges a patch into `customer` — used by the Wayl webhook to
   * backfill the name/phone/address the customer gave Wayl directly,
   * for orders we created with an empty `customer` (the card-payment
   * path no longer collects anything before redirecting). */
  mergeCustomer(ref: string, patch: Partial<Order["customer"]>): Promise<void>;
  /** Admin dashboard: full order list, newest first. */
  list(): Promise<Order[]>;
  /** Range-scoped list for the time-range slider (Orders, Dashboard,
   * Revenue) — a separate method rather than adding params to list()
   * so list()'s existing unfiltered/500-cap contract stays untouched for
   * its other callers. `start: null` means no lower bound ("All time"). */
  listInRange(start: Date | null, end: Date): Promise<Order[]>;
  /** Atomically claims this order for the one-time Meta CAPI purchase
   * event — returns the order if this call is the one that should send
   * it, or undefined if it was already sent (or the order doesn't exist). */
  claimForMetaCapi(ref: string): Promise<Order | undefined>;
  /** Overwrites the staff-only admin note (single field, not a log). */
  updateNote(ref: string, note: string): Promise<void>;
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
  admin_note: string | null;
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
    adminNote: row.admin_note ?? undefined,
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
             promo_code, ad_tracking, meta_capi_sent, admin_note
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
                promo_code, ad_tracking, meta_capi_sent, admin_note
    `;
    return rows[0] ? toOrder(rows[0]) : undefined;
  },
  async mergeCustomer(ref, patch) {
    await sql`
      update orders
      set customer = customer || ${jsonb(patch)}
      where ref = ${ref}
    `;
  },
  async list() {
    const rows = await sql<OrderRow[]>`
      select ref, created_at::text as created_at, locale, status,
             wayl_link_id, payment_method, mock, customer, lines, totals,
             promo_code, ad_tracking, meta_capi_sent, admin_note
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
                promo_code, ad_tracking, meta_capi_sent, admin_note
    `;
    return rows[0] ? toOrder(rows[0]) : undefined;
  },
  async updateNote(ref, note) {
    await sql`
      update orders set admin_note = ${note || null} where ref = ${ref}
    `;
  },
  async listInRange(start, end) {
    const rows = start
      ? await sql<OrderRow[]>`
          select ref, created_at::text as created_at, locale, status,
                 wayl_link_id, payment_method, mock, customer, lines, totals,
                 promo_code, ad_tracking, meta_capi_sent, admin_note
          from orders
          where created_at >= ${start} and created_at <= ${end}
          order by created_at desc
        `
      : await sql<OrderRow[]>`
          select ref, created_at::text as created_at, locale, status,
                 wayl_link_id, payment_method, mock, customer, lines, totals,
                 promo_code, ad_tracking, meta_capi_sent, admin_note
          from orders
          where created_at <= ${end}
          order by created_at desc
        `;
    return rows.map(toOrder);
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
  async mergeCustomer(ref, patch) {
    const all = await readAll();
    const order = all[ref];
    if (!order) return;
    order.customer = { ...order.customer, ...patch };
    await writeAll(all);
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
  async updateNote(ref, note) {
    const all = await readAll();
    const order = all[ref];
    if (!order) return;
    order.adminNote = note || undefined;
    await writeAll(all);
  },
  async listInRange(start, end) {
    const all = await readAll();
    const endMs = end.getTime();
    const startMs = start?.getTime();
    return Object.values(all)
      .filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return (startMs === undefined || t >= startMs) && t <= endMs;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
