import "server-only";
import { sql } from "@/lib/db/client";
import { PAID_STATUSES, FAILED_STATUSES, ABANDONED_GRACE_MINUTES } from "./queries-shared";

export { PAID_STATUSES, FAILED_STATUSES, ABANDONED_GRACE_MINUTES } from "./queries-shared";

/** Statuses that are resolved one way or another and should never show
 * up as a "lead to chase" in the abandoned-carts view — paid, failed,
 * or Cash on Delivery (a confirmed order awaiting fulfillment, not an
 * abandoned cart, even though it isn't "paid" yet). */
const NOT_ABANDONED_STATUSES = [
  ...PAID_STATUSES,
  ...FAILED_STATUSES,
  "CashOnDelivery",
] as const;

export async function getAbandonedCount(start: Date | null = null, end: Date = new Date()): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  const rows = start
    ? await sql<{ count: string }[]>`
        select count(*)::text as count
        from orders
        where status != all(${NOT_ABANDONED_STATUSES}) and deleted_at is null
          and created_at < now() - make_interval(mins => ${ABANDONED_GRACE_MINUTES})
          and created_at >= ${start} and created_at <= ${end}
      `
    : await sql<{ count: string }[]>`
        select count(*)::text as count
        from orders
        where status != all(${NOT_ABANDONED_STATUSES}) and deleted_at is null
          and created_at < now() - make_interval(mins => ${ABANDONED_GRACE_MINUTES})
          and created_at <= ${end}
      `;
  return Number(rows[0]?.count ?? 0);
}

export interface AbandonedOrder {
  ref: string;
  createdAt: string;
  minutesAgo: number;
  customerName: string;
  phone: string | null;
  email: string | null;
  total: number;
  itemCount: number;
  itemTitles: string[];
  status: string;
  adminNote: string | null;
}

/** Carts that were started (an order row exists) but never reached a
 * paid or explicitly-failed status, past the grace period — these are
 * the leads worth a follow-up call. `start`/`end` from the time-range
 * slider apply ON TOP of the grace-period cutoff, not instead of it — a
 * cart only shows once it's both old enough to count as abandoned AND
 * within the selected range. */
export async function listAbandonedOrders(
  start: Date | null = null,
  end: Date = new Date(),
): Promise<AbandonedOrder[]> {
  if (!process.env.DATABASE_URL) return [];
  const rows = start
    ? await sql<
        {
          ref: string;
          created_at: string;
          minutes_ago: string;
          first_name: string | null;
          last_name: string | null;
          legacy_full_name: string | null;
          phone: string | null;
          email: string | null;
          total: string;
          item_count: string;
          item_titles: string[];
          status: string;
          admin_note: string | null;
        }[]
      >`
        select
          ref,
          created_at::text as created_at,
          (extract(epoch from (now() - created_at)) / 60)::int::text as minutes_ago,
          customer->>'firstName' as first_name,
          customer->>'lastName' as last_name,
          customer->>'fullName' as legacy_full_name,
          customer->>'phone' as phone,
          customer->>'email' as email,
          totals->>'total' as total,
          jsonb_array_length(lines)::text as item_count,
          (select coalesce(array_agg(line->>'title'), '{}')
             from jsonb_array_elements(lines) as line) as item_titles,
          status,
          admin_note
        from orders
        where status != all(${NOT_ABANDONED_STATUSES}) and deleted_at is null
          and created_at < now() - make_interval(mins => ${ABANDONED_GRACE_MINUTES})
          and created_at >= ${start} and created_at <= ${end}
        order by created_at desc
      `
    : await sql<
    {
      ref: string;
      created_at: string;
      minutes_ago: string;
      first_name: string | null;
      last_name: string | null;
      legacy_full_name: string | null;
      phone: string | null;
      email: string | null;
      total: string;
      item_count: string;
      item_titles: string[];
      status: string;
      admin_note: string | null;
    }[]
  >`
    select
      ref,
      created_at::text as created_at,
      (extract(epoch from (now() - created_at)) / 60)::int::text as minutes_ago,
      customer->>'firstName' as first_name,
      customer->>'lastName' as last_name,
      customer->>'fullName' as legacy_full_name,
      customer->>'phone' as phone,
      customer->>'email' as email,
      totals->>'total' as total,
      jsonb_array_length(lines)::text as item_count,
      (select coalesce(array_agg(line->>'title'), '{}')
         from jsonb_array_elements(lines) as line) as item_titles,
      status,
      admin_note
    from orders
    where status != all(${NOT_ABANDONED_STATUSES}) and deleted_at is null
      and created_at < now() - make_interval(mins => ${ABANDONED_GRACE_MINUTES})
      and created_at <= ${end}
    order by created_at desc
  `;
  return rows.map((r) => ({
    ref: r.ref,
    createdAt: r.created_at,
    minutesAgo: Number(r.minutes_ago),
    // firstName/lastName for orders placed since international checkout
    // shipped; legacy_full_name covers orders placed before that.
    customerName:
      [r.first_name, r.last_name].filter(Boolean).join(" ") ||
      r.legacy_full_name ||
      "",
    phone: r.phone,
    email: r.email,
    total: Number(r.total),
    itemCount: Number(r.item_count),
    itemTitles: r.item_titles ?? [],
    status: r.status,
    adminNote: r.admin_note,
  }));
}
