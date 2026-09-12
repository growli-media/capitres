"use client";

import { useState, useTransition } from "react";
import { Users, ChartLineUp, ShoppingCartSimple } from "@phosphor-icons/react";
import TimeRangeSlider from "../components/TimeRangeSlider";
import { KpiCard } from "../components/KpiCard";
import { getAnalyticsForRangeAction, type AnalyticsRangeResult } from "./actions";
import { DEFAULT_TIME_RANGE_VALUE, type TimeRangeValue } from "@/lib/admin/time-range";
import AnalyticsMap from "./AnalyticsMap";
import RecentVisits from "./RecentVisits";

/**
 * Coordinates the Analytics page's pieces. Owns which visit is selected
 * — one-directional: selecting a visit in the list highlights it on the
 * map, but drilling the map down a level never selects a visit. Also
 * owns the time range (same slider + direct-Server-Action-call pattern
 * as RevenueView.tsx) and the visits list's page number, re-fetching
 * visits/aggregates/stats together on every change to either.
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

  function handlePageChange(page: number) {
    startTransition(async () => {
      const result = await getAnalyticsForRangeAction(range, page);
      setData(result);
    });
  }

  const selectedVisit = data.visits.find((v) => v.id === selectedVisitId) ?? null;

  return (
    <div>
      <TimeRangeSlider value={range} onChange={handleChange} pending={isPending} />

      <div className={`mt-6 grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 sm:max-w-2xl ${isPending ? "opacity-60" : ""}`}>
        <KpiCard icon={Users} label="Visits" value={String(data.visitCount)} delta={data.visitDelta} />
        <KpiCard
          icon={ChartLineUp}
          label="vs previous period"
          value={data.visitDelta === null ? "—" : data.visitDelta === 0 ? "No change" : `${data.visitDelta > 0 ? "+" : ""}${data.visitDelta}%`}
          valueTone={data.visitDelta === null || data.visitDelta === 0 ? undefined : data.visitDelta > 0 ? "up" : "down"}
        />
        <KpiCard
          icon={ShoppingCartSimple}
          label="Conversion rate"
          value={`${data.conversionRate}%`}
          delta={data.conversionRateDelta}
        />
      </div>

      <div className={`mt-6 space-y-6 transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <AnalyticsMap aggregates={data.aggregates} selectedVisit={selectedVisit} />
        <RecentVisits
          visits={data.visits}
          selectedVisitId={selectedVisitId}
          onSelectVisit={setSelectedVisitId}
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
