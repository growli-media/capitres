"use server";

import { getDashboardKpis, getTopProducts, type DashboardKpis, type TopProduct } from "@/lib/admin/dashboard";
import { getAbandonedCount } from "@/lib/admin/queries";
import { orderStore, type Order } from "@/lib/orders/store";
import { resolveTimeRange, previousPeriod, type TimeRangeValue } from "@/lib/admin/time-range";

export interface DashboardKpiDeltas {
  revenue: number | null;
  orderCount: number | null;
  aov: number | null;
  abandonedCount: number | null;
}

export interface DashboardRangeResult {
  kpis: DashboardKpis;
  /** Percent change vs. the immediately preceding period of the same
   * length — null per-field when the previous period had zero (nothing
   * to compare a percentage against) or null wholesale for "all time"
   * (no previous period exists at all). */
  kpiDeltas: DashboardKpiDeltas | null;
  abandonedCount: number;
  recentOrders: Order[];
  topProducts: TopProduct[];
}

/** null = "new" (previous period was zero, a percentage would be
 * meaningless/infinite) rather than 0, so the UI can show "New" instead
 * of a misleading "+100%". */
function computeDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getDashboardForRangeAction(range: TimeRangeValue): Promise<DashboardRangeResult> {
  const { start, end } = resolveTimeRange(range);
  const prev = previousPeriod(start, end);
  const [kpis, prevKpis, prevAbandoned, abandonedCount, recentOrders, topProducts] = await Promise.all([
    getDashboardKpis(start, end),
    prev ? getDashboardKpis(prev.start, prev.end) : Promise.resolve(null),
    prev ? getAbandonedCount(prev.start, prev.end) : Promise.resolve(null),
    getAbandonedCount(start, end),
    orderStore.listInRange(start, end),
    getTopProducts(5, start, end),
  ]);
  const kpiDeltas =
    prevKpis && prevAbandoned !== null
      ? {
          revenue: computeDelta(kpis.revenue, prevKpis.revenue),
          orderCount: computeDelta(kpis.orderCount, prevKpis.orderCount),
          aov: computeDelta(kpis.aov, prevKpis.aov),
          abandonedCount: computeDelta(abandonedCount, prevAbandoned),
        }
      : null;
  return {
    kpis,
    kpiDeltas,
    abandonedCount,
    recentOrders: recentOrders.slice(0, 6),
    topProducts,
  };
}
