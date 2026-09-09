"use client";

import { useState } from "react";
import type { VisitSummary, GeoAggregate } from "@/lib/admin/analytics";
import AnalyticsMap from "./AnalyticsMap";
import RecentVisits from "./RecentVisits";

/**
 * Coordinates the Analytics page's pieces. Owns which visit is selected —
 * one-directional: selecting a visit in the list highlights it on the
 * map (governorate/city drill-down, Phase 3+), but drilling the map down
 * a level never selects a visit.
 */
export default function AnalyticsView({
  initialVisits,
  aggregates,
}: {
  initialVisits: VisitSummary[];
  aggregates: GeoAggregate[];
}) {
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const selectedVisit = initialVisits.find((v) => v.id === selectedVisitId) ?? null;

  return (
    <div className="space-y-6">
      <AnalyticsMap aggregates={aggregates} selectedVisit={selectedVisit} />
      <RecentVisits visits={initialVisits} selectedVisitId={selectedVisitId} onSelectVisit={setSelectedVisitId} />
    </div>
  );
}
