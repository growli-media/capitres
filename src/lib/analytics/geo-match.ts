/**
 * Matches a visit's raw region/city string (from Vercel's geo headers,
 * e.g. "IQ-BG") against a geoBoundaries feature's properties. Tiered,
 * same philosophy as country-match.ts: try the precise signal first,
 * fall back to a fuzzier one, and let a real gap show as "unmatched"
 * rather than guess wrong. Verified live against Iraq's real ADM1 data:
 * geoBoundaries' shapeISO for Baghdad is "IQ-BG" — the EXACT string
 * Vercel's x-vercel-ip-country-region header uses — so exact shapeISO
 * matching is not a hopeful fallback, it's the primary, confirmed-
 * working path for at least this store's core market.
 */
export interface GeoBoundaryProperties {
  shapeName: string;
  shapeISO: string | null;
  shapeGroup: string;
  shapeType: string;
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\b(governorate|province|state|region|district)\b/g, "")
    .replace(/[.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `rawRegionOrCity` is exactly what's stored in visits.region/visits.city
 * (Vercel's header value, untouched). Returns the matching feature's
 * `shapeName`, or undefined — callers must treat "unmatched" as a normal
 * outcome (the visit still shows in lists, it just doesn't highlight on
 * the map), never an error. */
export function matchGeoBoundaryShape(
  rawValue: string,
  features: { properties: GeoBoundaryProperties }[],
): string | undefined {
  const exactIso = features.find((f) => f.properties.shapeISO === rawValue);
  if (exactIso) return exactIso.properties.shapeName;

  const normRaw = normalize(rawValue);
  const nameMatch = features.find((f) => normalize(f.properties.shapeName) === normRaw);
  if (nameMatch) return nameMatch.properties.shapeName;

  return undefined;
}
