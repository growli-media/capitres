import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/permissions";
import { DEFAULT_TIME_RANGE } from "@/lib/admin/time-range";
import { getAnalyticsForRangeAction } from "./actions";
import AnalyticsView from "./AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requirePermission("analytics");

  const initial = await getAnalyticsForRangeAction({ mode: "preset", key: DEFAULT_TIME_RANGE });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Analytics</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Anonymous visitor activity — no personal details unless a visitor gave them at checkout.
      </p>

      <div className="mt-6">
        <AnalyticsView initial={initial} />
      </div>
    </div>
  );
}
