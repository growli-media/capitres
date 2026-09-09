"use client";

import { useState, useTransition } from "react";
import { Users } from "@phosphor-icons/react";
import TimeRangeSlider from "../components/TimeRangeSlider";
import { getAnalyticsForRangeAction, type AnalyticsRangeResult } from "./actions";
import { DEFAULT_TIME_RANGE_VALUE, type TimeRangeValue } from "@/lib/admin/time-range";
import AnalyticsMap from "./AnalyticsMap";
import RecentVisits from "./RecentVisits";
import { glassCard } from "../../glass";

/**
 * Coordinates the Analytics page's pieces. Owns which visit is selected
 * — one-directional: selecting a visit in the list highlights it on the
 * map, but drilling the map down a level never selects a visit. Also
 * owns the time range (same slider + direct-Server-Action-call pattern
 * as RevenueView.tsx), re-fetching visits/aggregates/count together on
 * every change.
 */
export default function AnalyticsView({ initial }: { initial: AnalyticsRangeResult }) {
  const [range, setRange] = useState<TimeRangeValue>(DEFAULT_TIME_RANGE_VALUE);
  const [data, setData] = useState<AnalyticsRangeResult>(initial);
  const [isPending, startTransition] = useTransition();
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  function handleChange(value: TimeRangeValue) {
    setRange(value);
    setSelectedVisitId(null);
    startTransition(async () => {
      const result = await getAnalyticsForRangeAction(value);
      setData(result);
    });
  }

  const selectedVisit = data.visits.find((v) => v.id === selectedVisitId) ?? null;

  return (
    <div>
      <TimeRangeSlider value={range} onChange={handleChange} pending={isPending} />

      <div className={`mt-6 p-5 transition-opacity sm:max-w-xs ${glassCard} ${isPending ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Users size={16} />
          <span className="text-xs font-medium tracking-wide uppercase">Visits</span>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {data.visitCount}
        </div>
      </div>

      <div className={`mt-6 space-y-6 transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <AnalyticsMap aggregates={data.aggregates} selectedVisit={selectedVisit} />
        <RecentVisits visits={data.visits} selectedVisitId={selectedVisitId} onSelectVisit={setSelectedVisitId} />
      </div>
    </div>
  );
}
