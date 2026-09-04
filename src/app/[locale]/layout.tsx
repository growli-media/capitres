import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { routing, isRtl } from "@/i18n/routing";
import { catalog } from "@/lib/catalog";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
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
 * Sorani) uses Noto Kufi Arabic below — this family has zero Arabic glyphs.
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

/**
 * Arabic-script (ar + ku/Sorani): Noto Kufi Arabic — self-hosted static
 * family, client-supplied. Replaces the previous Google-hosted Noto Sans
 * Arabic; the CSS variable name stays --font-noto-ar so globals.css and
 * everything downstream needed no changes.
 */
const notoArabic = localFont({
  src: [
    { path: "../../fonts/noto-kufi-arabic/Thin.ttf", weight: "100", style: "normal" },
    { path: "../../fonts/noto-kufi-arabic/ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../../fonts/noto-kufi-arabic/Light.ttf", weight: "300", style: "normal" },
    { path: "../../fonts/noto-kufi-arabic/Regular.ttf", weight: "400", style: "normal" },
    { path: "../../fonts/noto-kufi-arabic/Medium.ttf", weight: "500", style: "normal" },
    { path: "../../fonts/noto-kufi-arabic/SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../fonts/noto-kufi-arabic/Bold.ttf", weight: "700", style: "normal" },
    { path: "../../fonts/noto-kufi-arabic/ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../../fonts/noto-kufi-arabic/Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-noto-ar",
  display: "swap",
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
          <CurrencyProvider>
            <PageviewTracker />
            <SmoothScroll />
            {/* Two RTL fixes, both about the *hidden* state of this link.
                `sr-only` leaves it absolutely positioned at its static
                position, which in RTL is the right edge — so it spilled past
                the viewport and Arabic phones zoomed the whole page out to
                fit. `start-0 top-0` pins it inside instead, and the padding
                moved to `focus:` because applied unconditionally it beat
                sr-only's own `padding: 0` and gave the hidden link a ~33px
                box. Visible/focused appearance is unchanged. */}
            <a
              href="#main"
              className="sr-only start-0 top-0 z-50 bg-ink text-paper focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:px-4 focus:py-3"
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
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
