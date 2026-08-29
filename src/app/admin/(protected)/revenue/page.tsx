import type { Metadata } from "next";
import { getRevenueSeries } from "@/lib/admin/revenue";
import { getDashboardKpis } from "@/lib/admin/dashboard";
import { requirePermission } from "@/lib/admin/permissions";
import { rangeToDates, DEFAULT_TIME_RANGE } from "@/lib/admin/time-range";
import RevenueView from "./RevenueView";

export const metadata: Metadata = { title: "Revenue" };

export default async function RevenuePage() {
  await requirePermission("revenue");

  const { start, end } = rangeToDates(DEFAULT_TIME_RANGE);
  const [series, kpis] = await Promise.all([
    getRevenueSeries(start, end),
    getDashboardKpis(start, end),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Revenue</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Paid orders only. Drag the slider to change the time range.
      </p>

      <div className="mt-6">
        <RevenueView
          initial={{ series, revenue: kpis.revenue, orderCount: kpis.orderCount, aov: kpis.aov }}
        />
      </div>
    </div>
  );
}
