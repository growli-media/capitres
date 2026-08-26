import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";

/** Localized display name for an ISO-3166 country code, via the platform's
 * own locale data — no hand-translated country list to maintain across
 * en/ar/ku. Falls back to the bare code if a locale's region data is
 * unavailable (rare, e.g. thin ICU coverage for a given language). */
export function countryName(code: CountryCode, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

/** Every country libphonenumber-js has calling-code data for, localized
 * and sorted by display name. */
export function sortedCountries(locale: string): CountryOption[] {
  return getCountries()
    .map((code) => ({
      code,
      name: countryName(code, locale),
      dialCode: getCountryCallingCode(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
