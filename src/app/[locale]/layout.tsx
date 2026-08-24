import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Noto_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";
import { routing, isRtl } from "@/i18n/routing";
import { catalog } from "@/lib/catalog";
import Header, {
  type NavCategory,
  type NavCollection,
} from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import CookieNotice from "@/components/layout/CookieNotice";
import SmoothScroll from "@/components/motion/SmoothScroll";
import PageTransition from "@/components/motion/PageTransition";
import RouteWipe from "@/components/motion/RouteWipe";
import AnalyticsScripts from "@/components/analytics/AnalyticsScripts";
import PageviewTracker from "@/components/analytics/PageviewTracker";
import "../globals.css";

/**
 * Latin display+body: SFT Schrifted Sans (self-hosted static family,
 * client-supplied — provided by the brand owner; confirm the commercial
 * license with Schrifteria Foundry before scaling distribution). Static
 * files per weight, not a variable font, so there's no "wdth" axis to
 * stretch headings wide the way Archivo's did — display weight now comes
 * from the ExtraBold/Black cuts themselves (see --display-stretch: 100%
 * in globals.css) rather than synthetic width. Arabic-script (ar + ku/
 * Sorani) keeps Noto Sans Arabic — this family has zero Arabic glyphs.
 */
const schrifted = localFont({
  src: [
    { path: "../../fonts/schrifted/Light.ttf", weight: "300", style: "normal" },
    { path: "../../fonts/schrifted/Regular.otf", weight: "400", style: "normal" },
    { path: "../../fonts/schrifted/Medium.ttf", weight: "500", style: "normal" },
    { path: "../../fonts/schrifted/DemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../fonts/schrifted/Bold.ttf", weight: "700", style: "normal" },
    { path: "../../fonts/schrifted/ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../../fonts/schrifted/Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-schrifted",
  display: "swap",
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
  const [collections, categories] = await Promise.all([
    catalog.getCollections(),
    catalog.getCategories(),
  ]);
  const navCollections: NavCollection[] = collections.map((c) => ({
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    image: c.heroImage.src,
    imageAlt: c.heroImage.alt,
    archived: c.archived,
  }));
  const navCategories: NavCategory[] = categories.map((c) => ({
    slug: c.slug,
    title: c.title,
  }));

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${schrifted.variable} ${notoArabic.variable}`}
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
          <Header collections={navCollections} categories={navCategories} />
          <main id="main">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <CartDrawer />
          <CookieNotice />
          <RouteWipe />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
