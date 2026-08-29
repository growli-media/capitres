"use client";

import { useState, useTransition } from "react";
import { CurrencyCircleDollar, Receipt, ChartLineUp } from "@phosphor-icons/react";
import TimeRangeSlider from "../components/TimeRangeSlider";
import RevenueChart from "./RevenueChart";
import { getRevenueForRangeAction, type RevenueRangeResult } from "./actions";
import { DEFAULT_TIME_RANGE, type TimeRangeKey } from "@/lib/admin/time-range";
import { formatIQD } from "@/lib/money";
import { glassCard } from "../../glass";

/** Owns the slider's selected range and re-fetches via a direct Server
 * Action call on change (the same useTransition + direct-action pattern
 * EditProfileForm.tsx already uses) — no API route needed. While a fetch
 * is pending, the previous chart/stats stay visible at reduced opacity
 * instead of a skeleton, per the dataviz skill's "refetch keeps the
 * frame" rule. */
export default function RevenueView({ initial }: { initial: RevenueRangeResult }) {
  const [range, setRange] = useState<TimeRangeKey>(DEFAULT_TIME_RANGE);
  const [data, setData] = useState<RevenueRangeResult>(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(key: TimeRangeKey) {
    setRange(key);
    startTransition(async () => {
      const result = await getRevenueForRangeAction(key);
      setData(result);
    });
  }

  return (
    <div>
      <TimeRangeSlider value={range} onChange={handleChange} pending={isPending} />

      <div className={`mt-6 grid gap-4 transition-opacity sm:grid-cols-3 ${isPending ? "opacity-60" : ""}`}>
        <div className={`p-5 ${glassCard}`}>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CurrencyCircleDollar size={16} />
            <span className="text-xs font-medium tracking-wide uppercase">Revenue</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {formatIQD(data.revenue, "en")}
          </div>
        </div>
        <div className={`p-5 ${glassCard}`}>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Receipt size={16} />
            <span className="text-xs font-medium tracking-wide uppercase">Paid orders</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {data.orderCount}
          </div>
        </div>
        <div className={`p-5 ${glassCard}`}>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ChartLineUp size={16} />
            <span className="text-xs font-medium tracking-wide uppercase">Avg. order value</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {formatIQD(data.aov, "en")}
          </div>
        </div>
      </div>

      <div className={`mt-6 px-5 pt-14 pb-5 transition-opacity ${glassCard} ${isPending ? "opacity-60" : ""}`}>
        <RevenueChart points={data.series} />
      </div>
    </div>
  );
}
