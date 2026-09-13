import "server-only";
import { sql } from "@/lib/db/client";
import { PAID_STATUSES } from "./queries";

export interface DashboardKpis {
  revenue: number;
  orderCount: number;
  aov: number;
  pendingReviews: number;
}

export async function getDashboardKpis(start: Date | null = null, end: Date = new Date()): Promise<DashboardKpis> {
  const [orderRows, reviewRows] = await Promise.all([
    start
      ? sql<{ revenue: string; order_count: string }[]>`
          select coalesce(sum((totals->>'total')::int), 0)::text as revenue,
                 count(*)::text as order_count
          from orders
          where status = any(${PAID_STATUSES}) and deleted_at is null
            and created_at >= ${start} and created_at <= ${end}
        `
      : sql<{ revenue: string; order_count: string }[]>`
          select coalesce(sum((totals->>'total')::int), 0)::text as revenue,
                 count(*)::text as order_count
          from orders
          where status = any(${PAID_STATUSES}) and deleted_at is null and created_at <= ${end}
        `,
    sql<{ count: string }[]>`
      select count(*)::text as count from reviews where approved = false
    `,
  ]);
  const revenue = Number(orderRows[0]?.revenue ?? 0);
  const orderCount = Number(orderRows[0]?.order_count ?? 0);
  return {
    revenue,
    orderCount,
    aov: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
    pendingReviews: Number(reviewRows[0]?.count ?? 0),
  };
}

export interface TopProduct {
  title: string;
  qty: number;
  revenue: number;
}

export async function getTopProducts(
  limit = 5,
  start: Date | null = null,
  end: Date = new Date(),
): Promise<TopProduct[]> {
  const rows = start
    ? await sql<{ title: string; qty: string; revenue: string }[]>`
        select
          line->>'title' as title,
          sum((line->>'qty')::int)::text as qty,
          sum((line->>'qty')::int * (line->>'unitAmount')::int)::text as revenue
        from orders, jsonb_array_elements(lines) as line
        where status = any(${PAID_STATUSES}) and deleted_at is null
          and created_at >= ${start} and created_at <= ${end}
        group by line->>'title'
        order by sum((line->>'qty')::int * (line->>'unitAmount')::int) desc
        limit ${limit}
      `
    : await sql<{ title: string; qty: string; revenue: string }[]>`
        select
          line->>'title' as title,
          sum((line->>'qty')::int)::text as qty,
          sum((line->>'qty')::int * (line->>'unitAmount')::int)::text as revenue
        from orders, jsonb_array_elements(lines) as line
        where status = any(${PAID_STATUSES}) and deleted_at is null and created_at <= ${end}
        group by line->>'title'
        order by sum((line->>'qty')::int * (line->>'unitAmount')::int) desc
        limit ${limit}
      `;
  return rows.map((r) => ({
    title: r.title,
    qty: Number(r.qty),
    revenue: Number(r.revenue),
  }));
}

export interface ShippingMethodStat {
  /** A real GES Express tier (Prime/Rapid/XLine/EcoLine), or "Standard"
   * for the legacy flat rate used when GES has no service for that
   * destination — see src/lib/shipping/constants.ts. A high count here
   * relative to the real tiers is a signal worth acting on: those are
   * destinations with no actual courier coverage. */
  method: string;
  count: number;
  /** Sum of totals.shipping (IQD) for orders using this method — what
   * shipping itself brought in, not the whole order. */
  revenue: number;
}

/** International shipping method breakdown for the Dashboard's shipping
 * section — paid orders only, same convention as every other Dashboard
 * number (getDashboardKpis/getTopProducts above). Domestic orders never
 * set shipping_method, so this is INTL-only without needing its own
 * region filter. */
export async function getShippingMethodBreakdown(
  start: Date | null = null,
  end: Date = new Date(),
): Promise<ShippingMethodStat[]> {
  const rows = start
    ? await sql<{ shipping_method: string; count: string; revenue: string }[]>`
        select shipping_method,
               count(*)::text as count,
               coalesce(sum((totals->>'shipping')::int), 0)::text as revenue
        from orders
        where status = any(${PAID_STATUSES}) and deleted_at is null
          and shipping_method is not null
          and created_at >= ${start} and created_at <= ${end}
        group by shipping_method
        order by count(*) desc
      `
    : await sql<{ shipping_method: string; count: string; revenue: string }[]>`
        select shipping_method,
               count(*)::text as count,
               coalesce(sum((totals->>'shipping')::int), 0)::text as revenue
        from orders
        where status = any(${PAID_STATUSES}) and deleted_at is null
          and shipping_method is not null and created_at <= ${end}
        group by shipping_method
        order by count(*) desc
      `;
  return rows.map((r) => ({
    method: r.shipping_method,
    count: Number(r.count),
    revenue: Number(r.revenue),
  }));
}
