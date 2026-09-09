import "server-only";
import { sql } from "@/lib/db/client";
import type { ReferrerSource } from "./referrer";
import type { VisitEventType } from "./track-visit";

export interface RecordVisitEventInput {
  visitorId: string;
  type: VisitEventType;
  path?: string;
  productSlug?: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  referrerSource: ReferrerSource;
  referrerHost?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

/** Upserts the visit (only `last_seen` is overwritten on a repeat visit
 * — first_seen/landing_path/referrer_source/utm_* describe how the
 * visit BEGAN and must never be clobbered by a later page view, e.g. an
 * Instagram-referred visitor browsing five more pages should still show
 * "social", not whatever document.referrer is by page five: your own
 * site) and appends one event row, in one transaction. */
export async function recordVisitEvent(input: RecordVisitEventInput): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`
      insert into visits (
        id, country, region, city, landing_path, referrer_source,
        referrer_host, utm_source, utm_medium, utm_campaign, user_agent
      ) values (
        ${input.visitorId}, ${input.country ?? null}, ${input.region ?? null}, ${input.city ?? null},
        ${input.path ?? "/"}, ${input.referrerSource}, ${input.referrerHost ?? null},
        ${input.utmSource ?? null}, ${input.utmMedium ?? null}, ${input.utmCampaign ?? null},
        ${input.userAgent ?? null}
      )
      on conflict (id) do update set last_seen = now()
    `;
    await tx`
      insert into visit_events (visit_id, type, path, product_slug)
      values (${input.visitorId}, ${input.type}, ${input.path ?? null}, ${input.productSlug ?? null})
    `;
  });
}
