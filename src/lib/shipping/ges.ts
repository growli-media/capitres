import "server-only";
import { unstable_cache } from "next/cache";

/**
 * GES Express courier client — https://gesexpress.com
 *
 * API surface implemented from their own hosted docs
 * (gesexpress.com/api-documentation, base https://gesexpress.com/api):
 *
 *   GET  /api/countries   list of destinations GES recognizes (no auth)
 *   POST /api/calculate   quote all four service tiers for one destination
 *
 * Auth: `Authorization: Bearer <token>` — a long-lived (~1yr) Laravel
 * Passport token issued to the Capitres business account, server-side
 * only, never exposed to the browser.
 *
 * MOCK MODE: when GES_EXPRESS_TOKEN is unset, getGesRates() returns fixed
 * placeholder tiers so checkout can be exercised end-to-end with no real
 * token — same convention as src/lib/payments/wayl.ts's mock mode.
 */

const GES_BASE_URL = "https://gesexpress.com/api";
/** The only package type CAPITRES ships — not a chooser, verbatim from
 * GES's own /calculate example ("Envelope", "Box", or "Pak"). */
const GES_SUB_TYPE = "Box";

export interface GesCountry {
  id: number;
  countryName: string;
  countryCode: string;
}

export type GesTierName = "Prime" | "Rapid" | "XLine" | "EcoLine";

export interface GesRateTier {
  name: GesTierName;
  priceUsd: number;
}

export type GesRateQuote =
  | { available: true; toCountry: string; countryCode?: string; tiers: GesRateTier[] }
  | { available: false; toCountry: string; message: string };

const TIER_FIELDS: [GesTierName, string][] = [
  ["Prime", "prime_price"],
  ["Rapid", "rapid_price"],
  ["XLine", "xline_price"],
  ["EcoLine", "ecoline_price"],
];

export function isGesMockMode(): boolean {
  return !process.env.GES_EXPRESS_TOKEN;
}

/**
 * GES lists Iraq alongside every other destination, but Iraq is handled
 * entirely by the separate domestic checkout path — it must never appear
 * as an "international" destination choice. The rest are either
 * uninhabited scientific-station/military-only territories no real
 * customer could ever ship to, or stale ISO entries GES's list never
 * dropped after the territory split into the separate countries it
 * already lists on their own (Serbia and Montenegro dissolved in 2006;
 * Netherlands Antilles dissolved in 2010, both now covered by their
 * successor entries already present in this same list).
 */
const EXCLUDED_COUNTRY_NAMES = new Set([
  "Iraq",
  "Antarctica",
  "Bouvet Island",
  "Heard Island and Mcdonald Islands",
  "French Southern Territories",
  "British Indian Ocean Territory",
  "South Georgia and the South Sandwich Islands",
  "United States Minor Outlying Islands",
  "Serbia and Montenegro",
  "Netherlands Antilles",
]);

async function fetchGesCountries(): Promise<GesCountry[]> {
  const res = await fetch(`${GES_BASE_URL}/countries`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GES /countries failed (${res.status})`);
  const json = (await res.json()) as {
    success: boolean;
    data: { id: number; country_name: string; country_code: string }[];
  };
  return json.data
    .filter((c) => !EXCLUDED_COUNTRY_NAMES.has(c.country_name))
    .map((c) => ({ id: c.id, countryName: c.country_name, countryCode: c.country_code }));
}

/** Political geography barely ever changes — cached a full day, same
 * pattern as src/lib/catalog/providers/postgres.ts's getCachedCollections.
 * unstable_cache never caches a thrown error, so a transient GES outage
 * just means the next call retries instead of poisoning the cache. */
export const getGesCountries = unstable_cache(fetchGesCountries, ["ges:countries"], {
  revalidate: 60 * 60 * 24,
});

/** Pure JSON -> type mapper, factored out so it's unit-testable against
 * the exact sample payloads in GES's docs without a network call. Any of
 * the four *_price fields can plausibly be absent for a country a given
 * tier doesn't serve — only finite-number fields survive into `tiers`. */
export function shapeGesCalculateResponse(toCountryFallback: string, json: unknown): GesRateQuote {
  const body = json as {
    success?: boolean;
    msg?: string;
    to_country?: string;
    country_code?: string;
    [key: string]: unknown;
  };
  const toCountry = body.to_country ?? toCountryFallback;
  if (!body.success) {
    return { available: false, toCountry, message: body.msg ?? "No shipping service available for this country." };
  }
  const tiers: GesRateTier[] = TIER_FIELDS.filter(
    ([, field]) => typeof body[field] === "number" && Number.isFinite(body[field]),
  ).map(([name, field]) => ({ name, priceUsd: body[field] as number }));

  if (tiers.length === 0) {
    return { available: false, toCountry, message: "No shipping service available for this country." };
  }
  return { available: true, toCountry, countryCode: body.country_code, tiers };
}

const MOCK_TIERS: GesRateTier[] = [
  { name: "Prime", priceUsd: 43 },
  { name: "Rapid", priceUsd: 38 },
  { name: "XLine", priceUsd: 30 },
  { name: "EcoLine", priceUsd: 22 },
];

/** Authoritative per-request — never cached at this layer (prices and
 * availability shouldn't go stale for long); callers that want to
 * protect the API's 60/hour rate limit add their own short-lived cache
 * around this (see src/app/api/shipping/rates/route.ts). */
export async function getGesRates(toCountry: string, weightKg: number): Promise<GesRateQuote> {
  if (isGesMockMode()) {
    return { available: true, toCountry, tiers: MOCK_TIERS };
  }

  const res = await fetch(`${GES_BASE_URL}/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.GES_EXPRESS_TOKEN}`,
    },
    body: JSON.stringify({ sub_type: GES_SUB_TYPE, to_country: toCountry, total_weight: weightKg }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GES /calculate failed (${res.status}): ${body}`);
  }
  return shapeGesCalculateResponse(toCountry, await res.json());
}
