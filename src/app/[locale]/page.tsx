import { getTranslations, setRequestLocale } from "next-intl/server";
import { catalog } from "@/lib/catalog";
import { routing } from "@/i18n/routing";
import type { Product } from "@/lib/catalog/types";
import FullBleedVideoPanel from "@/components/layout/FullBleedVideoPanel";
import SplitPanel from "@/components/layout/SplitPanel";
import AlbumScroll from "@/components/layout/AlbumScroll";
import { Reveal } from "@/components/motion/Reveal";
import ProductCard from "@/components/product/ProductCard";
import ProductMarqueeRow from "@/components/product/ProductMarqueeRow";
import heroImage from "@/images/brand/hero-editorial.jpg";
import royalEraPoster from "@/images/brand/hero-royal-era-poster.jpg";
import eightiesImage from "@/images/brand/collection-80s.jpg";
import fortyYearsImage from "@/images/brand/collection-40-years.jpg";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tHome, tNav, allProducts] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "nav" }),
    catalog.getProducts({}, "featured"),
  ]);

  // Two shoppable strips for the closing panel — same catalog, second row
  // reversed so the two don't read as mirrors of each other. Short
  // catalogues repeat up to MARQUEE_TARGET so the strip never looks sparse;
  // long ones are capped there so the loop stays a reasonable DOM size.
  const MARQUEE_TARGET = 14;
  const buildMarqueeList = (source: Product[]) => {
    if (source.length === 0) return [];
    if (source.length >= MARQUEE_TARGET) return source.slice(0, MARQUEE_TARGET);
    const repeats = Math.ceil(MARQUEE_TARGET / source.length);
    return Array.from({ length: repeats }, () => source)
      .flat()
      .slice(0, MARQUEE_TARGET);
  };
  const eligibleProducts = allProducts.filter(
    (p) => !p.giftCard && p.images.length > 0,
  );
  const marqueeRowA = buildMarqueeList(eligibleProducts);
  const marqueeRowB = buildMarqueeList([...eligibleProducts].reverse());
  const marqueeCard = (p: Product, key: string) => (
    // This panel is a hard 100svh box that clips overflow (see AlbumScroll)
    // rather than scrolling, so card width is tied to viewport height, not
    // just breakpoints — clamp(112px, min(24vw,20svh), 220px) keeps two
    // rows plus the heading fitting on a short laptop window exactly as
    // reliably as on a tall phone, instead of guessing per-breakpoint sizes.
    <div key={key} className="w-[clamp(132px,min(28vw,20svh),220px)] shrink-0">
      <ProductCard
        product={p}
        sizes="(min-width: 1024px) 220px, (min-width: 640px) 180px, 132px"
      />
    </div>
  );

  return (
    <AlbumScroll className="-mt-16 md:-mt-[4.75rem]">
      {/* ---------------- Scroll 1: Royal Era ----------------
          Opening moment — the same full-bleed video treatment as every
          other panel here, just first, with its own scroll-cue since
          nothing before it has taught the visitor to keep going yet. */}
      <FullBleedVideoPanel
        poster={royalEraPoster}
        videoSrc="/hero-royal-era.mp4"
        title={tHome("royalTitle")}
        sub={tHome("royalSub")}
        ctaLabel={tHome("royalCta")}
        href="/collections/royal-era"
        showScrollCue
      />

      {/* ---------------- Scroll 2: two collections, side by side ---------------- */}
      <SplitPanel
        left={{
          image: fortyYearsImage,
          alt: tHome("fortyAlt"),
          label: tHome("fortyTitle"),
          sub: tHome("fortySub"),
          cta: tHome("fortyCta"),
          href: "/collections/40s-journey",
        }}
        right={{
          image: eightiesImage,
          alt: tHome("eightiesAlt"),
          label: tHome("eightiesTitle"),
          sub: tHome("eightiesSub"),
          cta: tHome("eightiesCta"),
          // No "80s" collection exists yet — point at the shop rather
          // than a slug that doesn't exist. Swap to its real collection
          // href once it's created in admin.
          href: "/shop",
        }}
      />

      {/* ---------------- Scroll 3: our story ----------------
          Not tied to any collection — the same footage and poster the
          hero used to open on, now closing the album on the brand itself. */}
      <FullBleedVideoPanel
        poster={heroImage}
        videoSrc="/hero.mp4"
        title={tHome("storyTitle")}
        sub={tHome("storySub")}
        ctaLabel={tHome("storyCta")}
        href="/about"
      />

      {/* ---------------- Closing panel: shop, in motion ----------------
          Last stop before the footer — plain white, like the shop itself,
          with two strips of the catalog drifting past on their own. Real
          scroll containers underneath, so a drag, swipe, or wheel takes
          over instantly and autoplay resumes once the visitor lets go. */}
      {marqueeRowA.length > 0 && (
        <section className="flex h-[100svh] w-full flex-col justify-center gap-6 overflow-hidden bg-paper py-6 text-ink md:gap-8 md:py-8">
          <Reveal className="container-x">
            <h2 className="text-display text-center text-3xl sm:text-4xl md:text-5xl">
              {tNav("shopAll")}
            </h2>
          </Reveal>
          <div className="flex flex-col gap-3">
            <ProductMarqueeRow
              direction="left"
              primary={marqueeRowA.map((p, i) => marqueeCard(p, `a-${p.slug}-${i}`))}
              clone={marqueeRowA.map((p, i) => marqueeCard(p, `a2-${p.slug}-${i}`))}
            />
            <ProductMarqueeRow
              direction="right"
              primary={marqueeRowB.map((p, i) => marqueeCard(p, `b-${p.slug}-${i}`))}
              clone={marqueeRowB.map((p, i) => marqueeCard(p, `b2-${p.slug}-${i}`))}
            />
          </div>
        </section>
      )}
    </AlbumScroll>
  );
}
