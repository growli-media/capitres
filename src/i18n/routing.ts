import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "ku"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export const rtlLocales: AppLocale[] = ["ar", "ku"];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as AppLocale);
}

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  ar: "العربية",
  ku: "کوردی",
};
