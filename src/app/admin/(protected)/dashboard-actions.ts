"use server";

import { getDashboardKpis, getTopProducts, type DashboardKpis, type TopProduct } from "@/lib/admin/dashboard";
import { getAbandonedCount } from "@/lib/admin/queries";
import { orderStore, type Order } from "@/lib/orders/store";
import { rangeToDates, type TimeRangeKey } from "@/lib/admin/time-range";

export interface DashboardRangeResult {
  kpis: DashboardKpis;
  abandonedCount: number;
  recentOrders: Order[];
  topProducts: TopProduct[];
}

export async function getDashboardForRangeAction(rangeKey: TimeRangeKey): Promise<DashboardRangeResult> {
  const { start, end } = rangeToDates(rangeKey);
  const [kpis, abandonedCount, recentOrders, topProducts] = await Promise.all([
    getDashboardKpis(start, end),
    getAbandonedCount(start, end),
    orderStore.listInRange(start, end),
    getTopProducts(5, start, end),
  ]);
  return { kpis, abandonedCount, recentOrders: recentOrders.slice(0, 6), topProducts };
}
