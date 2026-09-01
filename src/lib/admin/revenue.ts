import "server-only";
import { sql } from "@/lib/db/client";
import { PAID_STATUSES } from "./queries";

export interface RevenuePoint {
  bucket: string;
  revenue: number;
  orders: number;
}

/** Day buckets for anything a month or under, week buckets up to half a
 * year, month buckets beyond that (and for "All time", which has no
 * start bound to size a day/week bucket count against) — keeps the chart
 * readable at every zoom level instead of rendering 365+ daily bars for
 * "Last year". */
function bucketUnit(start: Date | null, end: Date): "day" | "week" | "month" {
  if (!start) return "month";
  const days = (end.getTime() - start.getTime()) / 86_400_000;
  if (days <= 31) return "day";
  if (days <= 180) return "week";
  return "month";
}

export async function getRevenueSeries(start: Date | null, end: Date): Promise<RevenuePoint[]> {
  const unit = bucketUnit(start, end);
  const rows = start
    ? await sql<{ bucket: string; revenue: string; orders: string }[]>`
        select date_trunc(${unit}, created_at)::text as bucket,
               coalesce(sum((totals->>'total')::int), 0)::text as revenue,
               count(*)::text as orders
        from orders
        where status = any(${PAID_STATUSES}) and deleted_at is null
          and created_at >= ${start} and created_at <= ${end}
        group by bucket
        order by bucket asc
      `
    : await sql<{ bucket: string; revenue: string; orders: string }[]>`
        select date_trunc(${unit}, created_at)::text as bucket,
               coalesce(sum((totals->>'total')::int), 0)::text as revenue,
               count(*)::text as orders
        from orders
        where status = any(${PAID_STATUSES}) and deleted_at is null and created_at <= ${end}
        group by bucket
        order by bucket asc
      `;
  return rows.map((r) => ({
    bucket: r.bucket,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
}
