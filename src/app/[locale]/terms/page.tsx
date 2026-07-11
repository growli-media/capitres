import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PolicyShell from "@/components/policy/PolicyShell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policies" });
  return { title: t("termsTitle") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "policies" });

  return (
    <PolicyShell title={t("termsTitle")}>
      <p className="leading-[1.85] text-ink/75">{t("termsBody1")}</p>
      <p className="leading-[1.85] text-ink/75">{t("termsBody2")}</p>
    </PolicyShell>
  );
}
