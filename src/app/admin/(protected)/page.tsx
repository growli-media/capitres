import type { Metadata } from "next";
import { DEFAULT_TIME_RANGE } from "@/lib/admin/time-range";
import { getDashboardForRangeAction } from "./dashboard-actions";
import NightSkyBanner from "./components/NightSkyBanner";
import DashboardView from "./DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const initial = await getDashboardForRangeAction({ mode: "preset", key: DEFAULT_TIME_RANGE });

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
        <DashboardView initial={initial} />
      </div>
    </div>
  );
}
