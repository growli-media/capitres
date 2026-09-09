/**
 * Matches a Vercel geo header's ISO 3166-1 alpha-2 country code (e.g.
 * "IQ") to the country-name string world-atlas's countries-50m.json
 * uses for that same country (e.g. "Iraq") — needed because
 * AnalyticsMap.tsx shades/looks up world-atlas features by name, not by
 * ISO code. No hand-maintained alpha2→name table for all ~250 codes:
 * Intl.DisplayNames (built into Node/browsers, zero dependencies)
 * generates the English name at runtime, normalized for punctuation
 * differences (curly vs straight apostrophes, "&" vs "and"). Verified
 * this resolves 209/248 real ISO codes against the actual bundled
 * countries-50m.json (the -110m variant was tried first and rejected —
 * confirmed it omits Bahrain/Singapore/Malta entirely, real Gulf/nearby
 * traffic this store plausibly gets, so -50m is the deliberate,
 * evidence-based choice despite ~650KB more, admin-only so it doesn't
 * touch storefront bundle size). The remaining unresolved codes are
 * near-uninhabited territories (Bouvet Island, Heard & McDonald
 * Islands, ...) with no realistic traffic and, in most cases, no
 * separate polygon in the dataset even if matched by name.
 */

/** Genuine name-choice differences between Intl.DisplayNames' output
 * and world-atlas's Natural-Earth-derived names — not punctuation (that's
 * handled by normalize() below), real synonyms/abbreviations. Grown by
 * running scripts/verify-country-names.mjs against the real dataset;
 * add an entry here (not a guess) if a real visit's country doesn't
 * shade on the map. */
const NAME_OVERRIDES: Record<string, string> = {
  BA: "Bosnia and Herz.",
  CD: "Dem. Rep. Congo",
  CF: "Central African Rep.",
  CG: "Congo",
  DO: "Dominican Rep.",
  GQ: "Eq. Guinea",
  HK: "Hong Kong",
  KN: "St. Kitts and Nevis",
  MK: "Macedonia",
  MM: "Myanmar",
  MO: "Macao",
  PS: "Palestine",
  SS: "S. Sudan",
  SZ: "eSwatini",
  TR: "Turkey",
  TT: "Trinidad and Tobago",
  US: "United States of America",
  VA: "Vatican",
  VC: "St. Vin. and Gren.",
};

function normalize(name: string): string {
  return name.replace(/[’]/g, "'").replace(/ & /g, " and ").toLowerCase();
}

let displayNames: Intl.DisplayNames | undefined;
function getDisplayNames(): Intl.DisplayNames {
  displayNames ??= new Intl.DisplayNames(["en"], { type: "region" });
  return displayNames;
}

/** `worldAtlasNames` — the exact set of `properties.name` strings present
 * in the bundled topology, passed in so this stays a pure function with
 * no direct dependency on the JSON asset (keeps AnalyticsMap.tsx as the
 * single place that imports world-atlas). Returns undefined when no
 * match is found — callers should show the visit in lists regardless,
 * just without map shading, same convention as the sub-national
 * geo-match module. */
export function matchCountryName(alpha2: string, worldAtlasNames: ReadonlySet<string>): string | undefined {
  const override = NAME_OVERRIDES[alpha2];
  if (override) return worldAtlasNames.has(override) ? override : undefined;

  let raw: string;
  try {
    raw = getDisplayNames().of(alpha2) ?? alpha2;
  } catch {
    return undefined;
  }
  if (worldAtlasNames.has(raw)) return raw;

  const normRaw = normalize(raw);
  for (const name of worldAtlasNames) {
    if (normalize(name) === normRaw) return name;
  }
  return undefined;
}
