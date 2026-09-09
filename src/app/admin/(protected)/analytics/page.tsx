import type { Metadata } from "next";
import { getRecentVisits, getVisitAggregates } from "@/lib/admin/analytics";
import { requirePermission } from "@/lib/admin/permissions";
import AnalyticsView from "./AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requirePermission("analytics");

  const [visits, aggregates] = await Promise.all([getRecentVisits(50), getVisitAggregates()]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Analytics</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Anonymous visitor activity — no personal details unless a visitor gave them at checkout.
      </p>

      <div className="mt-6">
        <AnalyticsView initialVisits={visits} aggregates={aggregates} />
      </div>
    </div>
  );
}
