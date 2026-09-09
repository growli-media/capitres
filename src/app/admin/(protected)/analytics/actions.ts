"use server";

import {
  getVisitEvents,
  getRecentVisits,
  getVisitAggregates,
  getVisitCount,
  type VisitEvent,
  type VisitSummary,
  type GeoAggregate,
} from "@/lib/admin/analytics";
import { requirePermission } from "@/lib/admin/permissions";
import { resolveTimeRange, type TimeRangeValue } from "@/lib/admin/time-range";
import type { GeoBoundaryProperties } from "@/lib/analytics/geo-match";
import { rewindFeature } from "@/lib/analytics/rewind-geometry";

export async function getVisitEventsAction(visitId: string): Promise<VisitEvent[]> {
  await requirePermission("analytics");
  return getVisitEvents(visitId);
}

export interface AnalyticsRangeResult {
  visits: VisitSummary[];
  aggregates: GeoAggregate[];
  visitCount: number;
}

/** Same "pass a TimeRangeValue, get back scoped data" shape as Revenue's
 * getRevenueForRangeAction — the Analytics page's slider calls this on
 * every change. */
export async function getAnalyticsForRangeAction(range: TimeRangeValue): Promise<AnalyticsRangeResult> {
  await requirePermission("analytics");
  const { start, end } = resolveTimeRange(range);
  const [visits, aggregates, visitCount] = await Promise.all([
    getRecentVisits(50, start, end),
    getVisitAggregates(start, end),
    getVisitCount(start, end),
  ]);
  return { visits, aggregates, visitCount };
}

export interface GeoBoundaryFeature {
  type: "Feature";
  properties: GeoBoundaryProperties;
  geometry: { type: string; coordinates: unknown };
}

/** Political boundaries essentially never change, so this is cached for
 * 30 days via Next's fetch cache — a Server Action (not a route under
 * /api/admin/) on purpose: this codebase's admin session cookie is
 * scoped `path: "/admin"`, so anything under /api/admin/ silently never
 * receives it (see src/app/admin/blob-upload/route.ts's own comment on
 * the exact same bug already happening once). Prefers geoBoundaries'
 * pre-simplified geometry (smaller payload); falls back to the full
 * file for the rare country/level that doesn't have one. */
export async function getGeoBoundariesAction(
  iso3: string,
  level: "ADM1" | "ADM2",
): Promise<{ features: GeoBoundaryFeature[] } | { error: string }> {
  await requirePermission("analytics");

  const metaRes = await fetch(`https://www.geoboundaries.org/api/current/gbOpen/${iso3}/${level}/`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!metaRes.ok) return { error: "Couldn't reach geoBoundaries." };
  const meta = (await metaRes.json()) as {
    simplifiedGeometryGeoJSON?: string;
    gjDownloadURL?: string;
  };
  const geojsonUrl = meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL;
  if (!geojsonUrl) return { error: `No ${level} boundary data available for this country.` };

  const geoRes = await fetch(geojsonUrl, { next: { revalidate: 60 * 60 * 24 * 30 } });
  if (!geoRes.ok) return { error: "Couldn't load boundary shapes." };
  const geojson = (await geoRes.json()) as { features: GeoBoundaryFeature[] };
  // Rewound here, once, server-side — see rewind-geometry.ts's comment.
  // Rendering doesn't need it, but every spatial calculation downstream
  // (the ADM1↔ADM2 district-to-governorate join, marker placement) does.
  return { features: geojson.features.map(rewindFeature) };
}
