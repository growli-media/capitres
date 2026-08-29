import type { Metadata } from "next";
import { getDashboardKpis, getTopProducts } from "@/lib/admin/dashboard";
import { getAbandonedCount } from "@/lib/admin/queries";
import { orderStore } from "@/lib/orders/store";
import { rangeToDates, DEFAULT_TIME_RANGE } from "@/lib/admin/time-range";
import NightSkyBanner from "./components/NightSkyBanner";
import DashboardView from "./DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { start, end } = rangeToDates(DEFAULT_TIME_RANGE);
  const [kpis, topProducts, abandonedCount, recentOrders] = await Promise.all([
    getDashboardKpis(start, end),
    getTopProducts(5, start, end),
    getAbandonedCount(start, end),
    orderStore.listInRange(start, end),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Revenue counts paid orders only. Numbers update as soon as an order&rsquo;s
        status changes.
      </p>

      <div className="mt-6">
        <NightSkyBanner />
      </div>

      <div className="mt-6">
        <DashboardView
          initial={{ kpis, abandonedCount, recentOrders: recentOrders.slice(0, 6), topProducts }}
        />
      </div>
    </div>
  );
}
