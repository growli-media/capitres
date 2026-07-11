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
  return { title: t("privacyTitle") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "policies" });

  return (
    <PolicyShell title={t("privacyTitle")}>
      <p className="leading-[1.85] text-ink/75">{t("privacyBody1")}</p>
      <p className="leading-[1.85] text-ink/75">{t("privacyBody2")}</p>
    </PolicyShell>
  );
}
