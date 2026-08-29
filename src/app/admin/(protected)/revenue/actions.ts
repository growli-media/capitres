"use server";

import { getRevenueSeries } from "@/lib/admin/revenue";
import { getDashboardKpis } from "@/lib/admin/dashboard";
import { requirePermission } from "@/lib/admin/permissions";
import { resolveTimeRange, type TimeRangeValue } from "@/lib/admin/time-range";

export interface RevenueRangeResult {
  series: Awaited<ReturnType<typeof getRevenueSeries>>;
  revenue: number;
  orderCount: number;
  aov: number;
}

export async function getRevenueForRangeAction(range: TimeRangeValue): Promise<RevenueRangeResult> {
  await requirePermission("revenue");
  const { start, end } = resolveTimeRange(range);
  const [series, kpis] = await Promise.all([
    getRevenueSeries(start, end),
    getDashboardKpis(start, end),
  ]);
  return { series, revenue: kpis.revenue, orderCount: kpis.orderCount, aov: kpis.aov };
}
