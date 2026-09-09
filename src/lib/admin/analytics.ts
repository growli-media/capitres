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
  landingPath: string;
  referrerSource: ReferrerSource;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
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
  landing_path: string;
  referrer_source: ReferrerSource;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
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
    landingPath: row.landing_path,
    referrerSource: row.referrer_source,
    referrerHost: row.referrer_host,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    eventCount: row.event_count,
    convertedOrderRef: row.converted_order_ref,
  };
}

/** Admin Analytics list — newest activity first. The "converted order"
 * link is a plain best-effort correlated subquery against
 * orders.visitor_id, not a join — see schema.sql's comment on why that
 * column is deliberately not a foreign key. */
export async function getRecentVisits(limit = 50): Promise<VisitSummary[]> {
  const rows = await sql<VisitRow[]>`
    select v.id, v.first_seen::text as first_seen, v.last_seen::text as last_seen,
           v.country, v.region, v.city, v.landing_path, v.referrer_source, v.referrer_host,
           v.utm_source, v.utm_medium, v.utm_campaign,
           (select count(*) from visit_events e where e.visit_id = v.id)::int as event_count,
           (select o.ref from orders o
            where o.visitor_id = v.id and o.deleted_at is null
            order by o.created_at desc limit 1) as converted_order_ref
    from visits v
    order by v.last_seen desc
    limit ${limit}
  `;
  return rows.map(toVisitSummary);
}

export interface VisitEvent {
  id: string;
  type: VisitEventType;
  path: string | null;
  productSlug: string | null;
  occurredAt: string;
}

/** Chronological activity log for one visit — the admin's "recent
 * visits" row-expand and an order's BrowsingTrail both read this. Time
 * spent per step is computed by the caller (gap to the next event), not
 * stored — see visit_events' own comment in schema.sql. */
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
  count: number;
}

/** Visit counts per country/region/city — feeds the map's shading. */
export async function getVisitAggregates(): Promise<GeoAggregate[]> {
  const rows = await sql<GeoAggregate[]>`
    select country, region, city, count(*)::int as count
    from visits
    where country is not null
    group by country, region, city
  `;
  return rows;
}
