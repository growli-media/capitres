import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Archivo, Noto_Sans_Arabic } from "next/font/google";
import { routing, isRtl } from "@/i18n/routing";
import { catalog } from "@/lib/catalog";
import Header, { type NavCollection } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import SmoothScroll from "@/components/motion/SmoothScroll";
import AnalyticsScripts from "@/components/analytics/AnalyticsScripts";
import PageviewTracker from "@/components/analytics/PageviewTracker";
import "../globals.css";

/**
 * Latin display+body: Archivo variable (wght + wdth — the expanded cut
 * echoes the CAPITRES wordmark). Arabic-script (ar + ku/Sorani):
 * ONE family — Noto Sans Arabic variable — serves body (400–600) and
 * display (800) from the same files, covering the full Arabic block
 * including Kurdish letters (ە ۆ ێ ڕ ڵ). A separate kufi display face
 * was dropped deliberately: it added 162KB at VeryHigh priority and a
 * second late swap that destabilised LCP on throttled connections.
 *
 * Not preloaded: /en never uses it (zero bytes); ar/ku fetch on use.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  axes: ["wdth"],
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-ar",
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: t("home"),
      template: `%s — ${t("siteName")}`,
    },
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      siteName: t("siteName"),
      type: "website",
      locale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "a11y" });
  const collections = await catalog.getCollections();
  const navCollections: NavCollection[] = collections.map((c) => ({
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    image: c.heroImage.src,
    imageAlt: c.heroImage.alt,
    archived: c.archived,
  }));

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${archivo.variable} ${notoArabic.variable}`}
    >
      <body>
        <AnalyticsScripts />
        <NextIntlClientProvider>
          <PageviewTracker />
          <SmoothScroll />
          <a
            href="#main"
            className="sr-only z-50 bg-ink px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:start-2 focus:top-2"
          >
            {t("skipToContent")}
          </a>
          <Header collections={navCollections} />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
