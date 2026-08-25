import type { Currency } from "@/lib/catalog/types";

/**
 * Heuristic ISO-3166 country -> default display currency. Not meant to be
 * authoritative — Iraq, the US (+ territories) and the Eurozone get their
 * real currency; everything else is bucketed into whichever of the three
 * is geographically "nearest" (Middle East/South Asia/North Africa -> IQD,
 * the rest of Europe and Sub-Saharan Africa -> EUR, the Americas and
 * Asia-Pacific -> USD). Easy to adjust in one place; the customer can
 * always override via the currency switcher regardless of this default.
 */
export const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  IQ: "IQD",

  US: "USD",
  PR: "USD",
  GU: "USD",
  VI: "USD",
  AS: "USD",
  MP: "USD",

  // Eurozone
  AT: "EUR",
  BE: "EUR",
  CY: "EUR",
  EE: "EUR",
  FI: "EUR",
  FR: "EUR",
  DE: "EUR",
  GR: "EUR",
  HR: "EUR",
  IE: "EUR",
  IT: "EUR",
  LV: "EUR",
  LT: "EUR",
  LU: "EUR",
  MT: "EUR",
  NL: "EUR",
  PT: "EUR",
  SK: "EUR",
  SI: "EUR",
  ES: "EUR",

  // Middle East, South Asia, North Africa -> nearest to Iraq
  SA: "IQD",
  AE: "IQD",
  KW: "IQD",
  QA: "IQD",
  BH: "IQD",
  OM: "IQD",
  YE: "IQD",
  JO: "IQD",
  SY: "IQD",
  LB: "IQD",
  IL: "IQD",
  PS: "IQD",
  IR: "IQD",
  TR: "IQD",
  EG: "IQD",
  LY: "IQD",
  TN: "IQD",
  DZ: "IQD",
  MA: "IQD",
  PK: "IQD",
  AF: "IQD",
  IN: "IQD",
  BD: "IQD",
  LK: "IQD",

  // Rest of Europe -> nearest is EUR
  GB: "EUR",
  CH: "EUR",
  NO: "EUR",
  SE: "EUR",
  DK: "EUR",
  IS: "EUR",
  PL: "EUR",
  CZ: "EUR",
  HU: "EUR",
  RO: "EUR",
  BG: "EUR",
  RS: "EUR",
  BA: "EUR",
  AL: "EUR",
  MK: "EUR",
  ME: "EUR",
  MD: "EUR",
  UA: "EUR",
  BY: "EUR",
  RU: "EUR",

  // Sub-Saharan Africa -> nearest is EUR
  NG: "EUR",
  GH: "EUR",
  KE: "EUR",
  ET: "EUR",
  ZA: "EUR",
  TZ: "EUR",
  UG: "EUR",
  SN: "EUR",
  CI: "EUR",
  CM: "EUR",

  // Americas (non-US) -> nearest is USD
  CA: "USD",
  MX: "USD",
  BR: "USD",
  AR: "USD",
  CL: "USD",
  CO: "USD",
  PE: "USD",
  EC: "USD",
  VE: "USD",
  UY: "USD",
  PY: "USD",
  BO: "USD",
  CR: "USD",
  PA: "USD",
  DO: "USD",
  JM: "USD",
  TT: "USD",

  // Asia-Pacific -> nearest major bloc is USD
  CN: "USD",
  JP: "USD",
  KR: "USD",
  TW: "USD",
  HK: "USD",
  SG: "USD",
  MY: "USD",
  TH: "USD",
  VN: "USD",
  PH: "USD",
  ID: "USD",
  AU: "USD",
  NZ: "USD",
};

/** Falls back to USD for any country not explicitly mapped above, or when
 * no country header is available (e.g. local dev). */
export function detectCurrencyFromCountry(
  countryCode: string | null | undefined,
): Currency {
  if (!countryCode) return "USD";
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? "USD";
}
