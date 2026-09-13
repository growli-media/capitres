import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { getGesCountries, type GesCountry } from "@/lib/shipping/ges";

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
  let countries: GesCountry[] = [];
  try {
    countries = await getGesCountries();
  } catch (err) {
    // The international shipping-country picker just shows a retry
    // prompt instead — see CheckoutFlow.tsx.
    console.error("[checkout] Failed to load GES country list:", err);
  }
  return <CheckoutFlow countries={countries} />;
}
