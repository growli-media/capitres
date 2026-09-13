import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutFlow, { type LocalizedGesCountry } from "@/components/checkout/CheckoutFlow";
import { getGesCountries } from "@/lib/shipping/ges";
import { localizedCountryName } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("checkout"), robots: { index: false } };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  let countries: LocalizedGesCountry[] = [];
  try {
    const raw = await getGesCountries();
    // Localized here, server-side, rather than in the client component:
    // Chromium's own bundled ICU data has no Kurdish (nor "ckb") region
    // names at all — Intl.DisplayNames silently resolves to en-US in the
    // browser instead of throwing, so doing this client-side would have
    // quietly shown English names for the ku locale. Node's ICU build
    // has full Kurdish data, so computing (and sorting by) the display
    // name here and shipping it down as plain text sidesteps the gap
    // entirely.
    countries = raw
      .map((c) => ({ ...c, displayName: localizedCountryName(c.countryCode, locale, c.countryName) }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, locale));
  } catch (err) {
    // The international shipping-country picker just shows a retry
    // prompt instead — see CheckoutFlow.tsx.
    console.error("[checkout] Failed to load GES country list:", err);
  }
  return <CheckoutFlow countries={countries} />;
}
