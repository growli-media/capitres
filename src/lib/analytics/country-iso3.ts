/**
 * ISO 3166-1 alpha-2 → alpha-3, used only to turn a world-map click
 * (world-atlas gives a country name; Vercel's geo header gives alpha-2)
 * into the ISO3 code geoBoundaries' API needs
 * (GET /api/current/gbOpen/{ISO3}/{ADM1|ADM2}/).
 *
 * Deliberately NOT exhaustive (~250 codes) — unlike country-match.ts's
 * name-matching problem, alpha-2→alpha-3 is a fixed, unambiguous ISO
 * standard with no "which spelling does this dataset use" fuzziness, so
 * there's no correctness risk in only covering what's actually likely:
 * Iraq, its neighbors, and the other countries this store's traffic
 * realistically comes from. A country missing here just can't be
 * drilled into yet — AnalyticsMap.tsx shows a plain message rather than
 * erroring, and growing this list is a one-line addition whenever a
 * real visit needs a country that isn't here yet.
 */
export const COUNTRY_ISO3: Record<string, string> = {
  IQ: "IRQ",
  TR: "TUR",
  IR: "IRN",
  SY: "SYR",
  JO: "JOR",
  SA: "SAU",
  KW: "KWT",
  AE: "ARE",
  QA: "QAT",
  BH: "BHR",
  OM: "OMN",
  YE: "YEM",
  LB: "LBN",
  IL: "ISR",
  PS: "PSE",
  EG: "EGY",
  US: "USA",
  GB: "GBR",
  DE: "DEU",
  FR: "FRA",
  NL: "NLD",
  SE: "SWE",
  CA: "CAN",
  AU: "AUS",
};
