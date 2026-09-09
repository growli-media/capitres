import "server-only";
import { sql } from "@/lib/db/client";
import type { ReferrerSource } from "@/lib/analytics/referrer";
import type { VisitEventType } from "@/lib/analytics/track-visit";

export interface VisitSummary {
  id: string;
  firstSeen: string;
  lastSeen: string;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  landingPath: string;
  referrerSource: ReferrerSource;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  userAgent: string | null;
  eventCount: number;
  convertedOrderRef: string | null;
}

interface VisitRow {
  id: string;
  first_seen: string;
  last_seen: string;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  landing_path: string;
  referrer_source: ReferrerSource;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  event_count: number;
  converted_order_ref: string | null;
}

function toVisitSummary(row: VisitRow): VisitSummary {
  return {
    id: row.id,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    country: row.country,
    region: row.region,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    landingPath: row.landing_path,
    referrerSource: row.referrer_source,
    referrerHost: row.referrer_host,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    userAgent: row.user_agent,
    eventCount: row.event_count,
    convertedOrderRef: row.converted_order_ref,
  };
}

/** Admin Analytics list — newest activity first, optionally scoped to a
 * time range (matches TimeRangeSlider.tsx's "how many in this period"
 * convention used by Revenue/Dashboard — scoped on first_seen, since
 * that's when the visit itself started, not last_seen which can drift
 * outside the window for a long-running session). `start: null` means
 * no lower bound ("All time"), same convention as orderStore.
 * listInRange. The "converted order" link is a plain best-effort
 * correlated subquery against orders.visitor_id, not a join — see
 * schema.sql's comment on why that column is deliberately not a
 * foreign key. */
export async function getRecentVisits(
  limit = 50,
  start: Date | null = null,
  end: Date = new Date(),
): Promise<VisitSummary[]> {
  const rows = start
    ? await sql<VisitRow[]>`
        select v.id, v.first_seen::text as first_seen, v.last_seen::text as last_seen,
               v.country, v.region, v.city, v.latitude, v.longitude, v.landing_path, v.referrer_source, v.referrer_host,
               v.utm_source, v.utm_medium, v.utm_campaign, v.user_agent,
               (select count(*) from visit_events e where e.visit_id = v.id)::int as event_count,
               (select o.ref from orders o
                where o.visitor_id = v.id and o.deleted_at is null
                order by o.created_at desc limit 1) as converted_order_ref
        from visits v
        where v.first_seen >= ${start} and v.first_seen <= ${end}
        order by v.last_seen desc
        limit ${limit}
      `
    : await sql<VisitRow[]>`
        select v.id, v.first_seen::text as first_seen, v.last_seen::text as last_seen,
               v.country, v.region, v.city, v.latitude, v.longitude, v.landing_path, v.referrer_source, v.referrer_host,
               v.utm_source, v.utm_medium, v.utm_campaign, v.user_agent,
               (select count(*) from visit_events e where e.visit_id = v.id)::int as event_count,
               (select o.ref from orders o
                where o.visitor_id = v.id and o.deleted_at is null
                order by o.created_at desc limit 1) as converted_order_ref
        from visits v
        where v.first_seen <= ${end}
        order by v.last_seen desc
        limit ${limit}
      `;
  return rows.map(toVisitSummary);
}

/** Single visit, for the detail page (src/app/admin/(protected)/
 * analytics/visits/[id]/page.tsx) — same shape as a list row, just one
 * of them, unscoped by date (a permalink should work regardless of
 * whatever time range the list happened to be showing when it was
 * clicked). */
export async function getVisit(id: string): Promise<VisitSummary | undefined> {
  const rows = await sql<VisitRow[]>`
    select v.id, v.first_seen::text as first_seen, v.last_seen::text as last_seen,
           v.country, v.region, v.city, v.latitude, v.longitude, v.landing_path, v.referrer_source, v.referrer_host,
           v.utm_source, v.utm_medium, v.utm_campaign, v.user_agent,
           (select count(*) from visit_events e where e.visit_id = v.id)::int as event_count,
           (select o.ref from orders o
            where o.visitor_id = v.id and o.deleted_at is null
            order by o.created_at desc limit 1) as converted_order_ref
    from visits v
    where v.id = ${id}
    limit 1
  `;
  return rows[0] ? toVisitSummary(rows[0]) : undefined;
}

/** Total visits started today (local server date boundary — same
 * "today" the rest of the admin dashboard already means when it says
 * that word, e.g. getOpenOrdersCount's neighbors). Powers the Dashboard
 * KPI tile. */
export async function getVisitsTodayCount(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count from visits where first_seen >= ${startOfDay}
  `;
  return Number(rows[0]?.count ?? 0);
}

/** Total visits within a range — the Analytics page's own headline
 * number, same role orderCount plays on Revenue. */
export async function getVisitCount(start: Date | null, end: Date): Promise<number> {
  const rows = start
    ? await sql<{ count: string }[]>`
        select count(*)::text as count from visits where first_seen >= ${start} and first_seen <= ${end}
      `
    : await sql<{ count: string }[]>`
        select count(*)::text as count from visits where first_seen <= ${end}
      `;
  return Number(rows[0]?.count ?? 0);
}

export interface VisitEvent {
  id: string;
  type: VisitEventType;
  path: string | null;
  productSlug: string | null;
  occurredAt: string;
}

/** Chronological activity log for one visit — the admin's "recent
 * visits" row-expand, the visit detail page, and an order's
 * BrowsingTrail all read this. Time spent per step is computed by the
 * caller (gap to the next event), not stored — see visit_events' own
 * comment in schema.sql. */
export async function getVisitEvents(visitId: string): Promise<VisitEvent[]> {
  const rows = await sql<
    { id: string; type: VisitEventType; path: string | null; product_slug: string | null; occurred_at: string }[]
  >`
    select id::text, type, path, product_slug, occurred_at::text as occurred_at
    from visit_events
    where visit_id = ${visitId}
    order by occurred_at asc
  `;
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    path: r.path,
    productSlug: r.product_slug,
    occurredAt: r.occurred_at,
  }));
}

export interface GeoAggregate {
  country: string;
  region: string | null;
  city: string | null;
  /** A visit's lat/lng is effectively constant per city (Vercel resolves
   * IPs to a fixed city-centroid point, not a precise address), so
   * grouping by it alongside region/city doesn't fragment the count —
   * see AnalyticsMap.tsx, which prefers point-in-polygon matching against
   * this over region/city text matching wherever it's available. */
  latitude: number | null;
  longitude: number | null;
  count: number;
}

/** Visit counts per country/region/city(/point) — feeds the map's
 * shading, optionally scoped to the same time range as the rest of the
 * page. */
export async function getVisitAggregates(start: Date | null = null, end: Date = new Date()): Promise<GeoAggregate[]> {
  const rows = start
    ? await sql<GeoAggregate[]>`
        select country, region, city, latitude, longitude, count(*)::int as count
        from visits
        where country is not null and first_seen >= ${start} and first_seen <= ${end}
        group by country, region, city, latitude, longitude
      `
    : await sql<GeoAggregate[]>`
        select country, region, city, latitude, longitude, count(*)::int as count
        from visits
        where country is not null and first_seen <= ${end}
        group by country, region, city, latitude, longitude
      `;
  return rows;
}
