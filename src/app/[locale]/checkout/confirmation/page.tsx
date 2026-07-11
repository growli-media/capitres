import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import ConfirmationClient from "@/components/checkout/ConfirmationClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("stepConfirm"), robots: { index: false } };
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { ref } = await searchParams;
  if (!ref) notFound();
  return <ConfirmationClient orderRef={ref} />;
}
