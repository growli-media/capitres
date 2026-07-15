import "server-only";
import { sql } from "@/lib/db/client";

/** Orders that count as revenue / a completed sale. */
export const PAID_STATUSES = ["Complete", "Delivered", "MockPaid"] as const;
/** Orders that will never be paid — explicitly resolved, not abandoned. */
export const FAILED_STATUSES = ["Cancelled", "Rejected", "Returned"] as const;

/**
 * An order counts as "abandoned" once it's sat unresolved (no payment,
 * no explicit cancellation) past a grace period — long enough that
 * someone still mid-checkout doesn't show up as a lead to chase.
 */
export const ABANDONED_GRACE_MINUTES = 20;

export async function getAbandonedCount(): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count
    from orders
    where status != all(${PAID_STATUSES})
      and status != all(${FAILED_STATUSES})
      and created_at < now() - make_interval(mins => ${ABANDONED_GRACE_MINUTES})
  `;
  return Number(rows[0]?.count ?? 0);
}

export interface AbandonedOrder {
  ref: string;
  createdAt: string;
  minutesAgo: number;
  customerName: string;
  phone: string;
  email: string;
  total: number;
  itemCount: number;
  itemTitles: string[];
  status: string;
}

/** Carts that were started (an order row exists) but never reached a
 * paid or explicitly-failed status, past the grace period — these are
 * the leads worth a follow-up call. */
export async function listAbandonedOrders(): Promise<AbandonedOrder[]> {
  if (!process.env.DATABASE_URL) return [];
  const rows = await sql<
    {
      ref: string;
      created_at: string;
      minutes_ago: string;
      name: string;
      phone: string;
      email: string;
      total: string;
      item_count: string;
      item_titles: string[];
      status: string;
    }[]
  >`
    select
      ref,
      created_at::text as created_at,
      (extract(epoch from (now() - created_at)) / 60)::int::text as minutes_ago,
      customer->>'fullName' as name,
      customer->>'phone' as phone,
      customer->>'email' as email,
      totals->>'total' as total,
      jsonb_array_length(lines)::text as item_count,
      (select coalesce(array_agg(line->>'title'), '{}')
         from jsonb_array_elements(lines) as line) as item_titles,
      status
    from orders
    where status != all(${PAID_STATUSES})
      and status != all(${FAILED_STATUSES})
      and created_at < now() - make_interval(mins => ${ABANDONED_GRACE_MINUTES})
    order by created_at desc
  `;
  return rows.map((r) => ({
    ref: r.ref,
    createdAt: r.created_at,
    minutesAgo: Number(r.minutes_ago),
    customerName: r.name,
    phone: r.phone,
    email: r.email,
    total: Number(r.total),
    itemCount: Number(r.item_count),
    itemTitles: r.item_titles ?? [],
    status: r.status,
  }));
}
