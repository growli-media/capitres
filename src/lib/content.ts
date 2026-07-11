import type { AppLocale } from "@/i18n/routing";

/**
 * Every piece of catalog content (products, collections, posts) carries
 * copy in all three storefront locales. Nothing user-facing is stored as
 * a bare English string.
 */
export type LocalizedString = Record<AppLocale, string>;

export function pick(value: LocalizedString, locale: string): string {
  return value[locale as AppLocale] ?? value.en;
}
