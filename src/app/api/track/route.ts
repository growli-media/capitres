import { NextRequest, NextResponse } from "next/server";
import { VISITOR_COOKIE } from "@/lib/analytics/visitor-cookie";
import { classifyReferrer } from "@/lib/analytics/referrer";
import { recordVisitEvent } from "@/lib/analytics/visits-store";
import type { VisitEventType } from "@/lib/analytics/track-visit";

interface TrackBody {
  type: VisitEventType;
  path?: string;
  productSlug?: string;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

const VALID_TYPES: VisitEventType[] = ["page_view", "product_view", "add_to_cart"];

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * First-party visit beacon — powers the admin Analytics section. The
 * visitor-id cookie is minted exclusively by src/proxy.ts on a real
 * storefront page load, never accepted from the client here — the only
 * spam mitigation this endpoint has for v1 (there's no rate-limiting
 * infrastructure anywhere else in this codebase either).
 */
export async function POST(request: NextRequest) {
  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    return NextResponse.json({ error: "no-visitor-cookie" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TrackBody | null;
  if (!body || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  }

  const { source, referrerHost } = classifyReferrer(
    body.referrer ?? null,
    body.utmSource ?? null,
    request.headers.get("host") ?? "",
  );

  await recordVisitEvent({
    visitorId,
    type: body.type,
    path: body.path?.slice(0, 500),
    productSlug: body.productSlug?.slice(0, 200),
    country: request.headers.get("x-vercel-ip-country"),
    region: request.headers.get("x-vercel-ip-country-region"),
    city: request.headers.get("x-vercel-ip-city"),
    latitude: parseCoordinate(request.headers.get("x-vercel-ip-latitude")),
    longitude: parseCoordinate(request.headers.get("x-vercel-ip-longitude")),
    userAgent: request.headers.get("user-agent")?.slice(0, 500),
    referrerSource: source,
    referrerHost,
    utmSource: body.utmSource?.slice(0, 200) ?? null,
    utmMedium: body.utmMedium?.slice(0, 200) ?? null,
    utmCampaign: body.utmCampaign?.slice(0, 200) ?? null,
  });

  return NextResponse.json({ ok: true });
}
