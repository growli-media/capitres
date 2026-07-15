import "server-only";
import { sql } from "@/lib/db/client";
import { PAID_STATUSES } from "./queries";

export interface DashboardKpis {
  revenue: number;
  orderCount: number;
  aov: number;
  pendingReviews: number;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const [orderRows, reviewRows] = await Promise.all([
    sql<{ revenue: string; order_count: string }[]>`
      select coalesce(sum((totals->>'total')::int), 0)::text as revenue,
             count(*)::text as order_count
      from orders
      where status = any(${PAID_STATUSES})
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

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const rows = await sql<{ title: string; qty: string; revenue: string }[]>`
    select
      line->>'title' as title,
      sum((line->>'qty')::int)::text as qty,
      sum((line->>'qty')::int * (line->>'unitAmount')::int)::text as revenue
    from orders, jsonb_array_elements(lines) as line
    where status = any(${PAID_STATUSES})
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
