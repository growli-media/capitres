import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PolicyShell from "@/components/policy/PolicyShell";
import { formatIQD } from "@/lib/money";
import {
  SHIPPING_RATE_IQ,
  SHIPPING_RATE_INTL,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/commerce/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policies" });
  return { title: t("shippingTitle") };
}

export default async function ShippingReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "policies" });

  const sections = [
    {
      title: t("shippingDomesticTitle"),
      body: t("shippingDomesticBody", {
        flat: formatIQD(SHIPPING_RATE_IQ, locale),
        threshold: formatIQD(FREE_SHIPPING_THRESHOLD, locale),
      }),
    },
    {
      title: t("shippingIntlTitle"),
      body: t("shippingIntlBody", {
        flat: formatIQD(SHIPPING_RATE_INTL, locale),
        threshold: formatIQD(FREE_SHIPPING_THRESHOLD, locale),
      }),
    },
    { title: t("returnsTitle"), body: t("returnsBody") },
  ];

  return (
    <PolicyShell title={t("shippingTitle")} intro={t("shippingIntro")}>
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="text-display mb-3 text-xl md:text-2xl">{s.title}</h2>
          <p className="leading-[1.85] text-ink/75">{s.body}</p>
        </section>
      ))}
    </PolicyShell>
  );
}
