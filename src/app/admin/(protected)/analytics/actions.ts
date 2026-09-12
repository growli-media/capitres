"use server";

import {
  getVisitEvents,
  getRecentVisits,
  getVisitAggregates,
  getVisitCount,
  getConvertedVisitCount,
  type VisitEvent,
  type VisitSummary,
  type GeoAggregate,
} from "@/lib/admin/analytics";
import { requirePermission } from "@/lib/admin/permissions";
import { resolveTimeRange, previousPeriod, type TimeRangeValue } from "@/lib/admin/time-range";
import type { GeoBoundaryProperties } from "@/lib/analytics/geo-match";
import { rewindFeature } from "@/lib/analytics/rewind-geometry";

export async function getVisitEventsAction(visitId: string): Promise<VisitEvent[]> {
  await requirePermission("analytics");
  return getVisitEvents(visitId);
}

/** Visits list page size — RecentVisits.tsx pages through older visits
 * with this many per page rather than the old fixed cap of 50 and
 * nothing past it. Not exported: a "use server" file may only export
 * async functions (and types), so this stays a private constant used
 * only inside getAnalyticsForRangeAction below. */
const VISITS_PAGE_SIZE = 10;

/** null = "new" (previous period was zero, a percentage would be
 * meaningless/infinite) rather than 0 — mirrors dashboard-actions.ts's
 * own computeDelta exactly; kept as a separate copy rather than a shared
 * import since that's already this codebase's convention for this tiny,
 * feature-local calculation (dashboard-actions.ts doesn't import it from
 * anywhere shared either). */
function computeDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface AnalyticsRangeResult {
  visits: VisitSummary[];
  aggregates: GeoAggregate[];
  visitCount: number;
  /** Percent change vs. the immediately preceding period of the same
   * length — null for "all time" (no previous period exists). */
  visitDelta: number | null;
  /** Share of visits in range that went on to place an order, 0-100
   * (one decimal place), plus its own delta vs. the previous period. */
  conversionRate: number;
  conversionRateDelta: number | null;
  page: number;
  totalPages: number;
}

/** Same "pass a TimeRangeValue, get back scoped data" shape as Revenue's
 * getRevenueForRangeAction — the Analytics page's slider calls this on
 * every range change; RecentVisits.tsx's pager calls it again with just
 * `page` bumped, reusing the same range. */
export async function getAnalyticsForRangeAction(
  range: TimeRangeValue,
  page = 1,
): Promise<AnalyticsRangeResult> {
  await requirePermission("analytics");
  const { start, end } = resolveTimeRange(range);
  const prev = previousPeriod(start, end);
  const offset = (page - 1) * VISITS_PAGE_SIZE;

  const [visits, aggregates, visitCount, convertedCount, prevVisitCount, prevConvertedCount] =
    await Promise.all([
      getRecentVisits(VISITS_PAGE_SIZE, start, end, offset),
      getVisitAggregates(start, end),
      getVisitCount(start, end),
      getConvertedVisitCount(start, end),
      prev ? getVisitCount(prev.start, prev.end) : Promise.resolve(null),
      prev ? getConvertedVisitCount(prev.start, prev.end) : Promise.resolve(null),
    ]);

  const conversionRate = visitCount > 0 ? Math.round((convertedCount / visitCount) * 1000) / 10 : 0;
  const prevConversionRate =
    prevVisitCount !== null && prevConvertedCount !== null && prevVisitCount > 0
      ? (prevConvertedCount / prevVisitCount) * 100
      : null;

  return {
    visits,
    aggregates,
    visitCount,
    visitDelta: prevVisitCount !== null ? computeDelta(visitCount, prevVisitCount) : null,
    conversionRate,
    conversionRateDelta: prevConversionRate !== null ? computeDelta(conversionRate, prevConversionRate) : null,
    page,
    totalPages: Math.max(1, Math.ceil(visitCount / VISITS_PAGE_SIZE)),
  };
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
