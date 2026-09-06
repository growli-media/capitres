import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import PolicyShell from "@/components/policy/PolicyShell";
import { getLegalPage, legalPageBody, legalPageTitle } from "@/lib/legal-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const page = await getLegalPage("size-guide");
  return { title: page ? legalPageTitle(page, locale) : "Size Guide" };
}

export default async function SizeGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await getLegalPage("size-guide");
  if (!page) notFound();

  return (
    <PolicyShell title={legalPageTitle(page, locale)}>
      {legalPageBody(page, locale).map((block, i) =>
        block.type === "heading" ? (
          <h2 key={i} className="text-display text-xl md:text-2xl">
            {block.text}
          </h2>
        ) : (
          <p key={i} className="price whitespace-pre-line leading-[1.85] text-ink/75">
            {block.text}
          </p>
        ),
      )}
    </PolicyShell>
  );
}
