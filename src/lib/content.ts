import type { AppLocale } from "@/i18n/routing";
import type { ImageSource } from "@/lib/catalog/types";

/**
 * Every piece of catalog content (products, collections, posts) carries
 * copy in all three storefront locales. Nothing user-facing is stored as
 * a bare English string.
 */
export type LocalizedString = Record<AppLocale, string>;

export function pick(value: LocalizedString, locale: string): string {
  return value[locale as AppLocale] ?? value.en;
}

/** Stable string key/URL for a ProductImage.src, regardless of source. */
export function imageSrcKey(src: ImageSource): string {
  return typeof src === "string" ? src : src.src;
}

/** ICU's BCP-47 tag for "ku" resolves to Kurmanji written in Latin script
 * (e.g. "Almanya") — but this site's own ku.json content is Sorani,
 * written in Arabic script (e.g. "ئەڵمانیا"). "ckb" is the ISO 639-3 tag
 * for Sorani/Central Kurdish and gives ICU region names matching that
 * same script, so a country name doesn't visually clash with the rest of
 * the Kurdish UI around it. */
const INTL_LOCALE_FOR_REGION_NAMES: Record<string, string> = { ku: "ckb" };

/** Localized country name from an ISO 3166-1 alpha-2 code, via the
 * platform's own ICU data — no per-country translation table to
 * maintain. Falls back to `fallback` (the English name GES itself
 * returns) if the code doesn't resolve for that locale. */
export function localizedCountryName(countryCode: string, locale: string, fallback: string): string {
  try {
    const intlLocale = INTL_LOCALE_FOR_REGION_NAMES[locale] ?? locale;
    const name = new Intl.DisplayNames([intlLocale], { type: "region" }).of(countryCode);
    return name ?? fallback;
  } catch {
    return fallback;
  }
}
