import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { routing } from "@/i18n/routing";
import type { ImageProps } from "next/image";
import type { Product } from "@/lib/catalog/types";
import HeroMedia from "@/components/layout/HeroMedia";
import FullBleedPanel from "@/components/layout/FullBleedPanel";
import SplitPanel from "@/components/layout/SplitPanel";
import AlbumScroll from "@/components/layout/AlbumScroll";
import { Reveal } from "@/components/motion/Reveal";
import ProductCard from "@/components/product/ProductCard";
import ProductMarqueeRow from "@/components/product/ProductMarqueeRow";
import heroImage from "@/images/brand/hero-editorial.jpg";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type PanelSpec = {
  image: ImageProps["src"];
  alt: string;
  eyebrow?: string;
  title: string;
  ctaLabel: string;
  href: string;
};

type Slot =
  | { kind: "split"; left: PanelSpec; right: PanelSpec }
  | { kind: "panel"; spec: PanelSpec };

const PANEL_COUNT = 8; // + hero + closing shop-all panel = 10 full-screen sections to the footer

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tHome, tNav, collections, newArrivals, heritageProducts, allProducts] =
    await Promise.all([
      getTranslations({ locale, namespace: "hero" }),
      getTranslations({ locale, namespace: "home" }),
      getTranslations({ locale, namespace: "nav" }),
      catalog.getCollections(),
      catalog.getProducts({ isNew: true }, "newest"),
      catalog.getProducts({ collection: "heritage-capsule" }, "featured"),
      catalog.getProducts({}, "featured"),
    ]);

  const liveCollections = collections.filter((c) => !c.archived);
  const heritage = collections.find((c) => c.slug === "heritage-capsule");
  const collectionPanels = liveCollections.filter(
    (c) => c.slug !== "heritage-capsule",
  );
  const heritageImage =
    heritage?.heroImage.src ?? heritageProducts[0]?.images[0]?.src;

  // Build a fixed-length sequence of panel slots so the album is always the
  // same length regardless of how much real catalog content exists yet: the
  // first two collections become a side-by-side "two tiles" moment (one
  // slot), then remaining collections, new arrivals, heritage, and the brand
  // story fill the rest — padded with heritage products if the catalog is
  // still sparse.
  const pool = [...collectionPanels];
  const slots: Slot[] = [];

  if (pool.length >= 2) {
    const [a, b] = pool.splice(0, 2);
    slots.push({
      kind: "split",
      left: {
        image: a.heroImage.src,
        alt: pick(a.heroImage.alt, locale),
        title: pick(a.title, locale),
        ctaLabel: tHome("viewAll"),
        href: `/collections/${a.slug}`,
      },
      right: {
        image: b.heroImage.src,
        alt: pick(b.heroImage.alt, locale),
        title: pick(b.title, locale),
        ctaLabel: tHome("viewAll"),
        href: `/collections/${b.slug}`,
      },
    });
  }

  for (const c of pool) {
    slots.push({
      kind: "panel",
      spec: {
        image: c.heroImage.src,
        alt: pick(c.heroImage.alt, locale),
        eyebrow: pick(c.tagline, locale),
        title: pick(c.title, locale),
        ctaLabel: tHome("viewAll"),
        href: `/collections/${c.slug}`,
      },
    });
  }

  if (newArrivals[0]?.images[0]) {
    slots.push({
      kind: "panel",
      spec: {
        image: newArrivals[0].images[0].src,
        alt: pick(newArrivals[0].images[0].alt, locale),
        eyebrow: tHome("newEyebrow"),
        title: tHome("newTitle"),
        ctaLabel: tHome("viewAll"),
        href: "/shop?new=1",
      },
    });
  }

  if (heritage && heritageImage) {
    slots.push({
      kind: "panel",
      spec: {
        image: heritageImage,
        alt: pick(heritage.heroImage.alt, locale),
        eyebrow: tHome("heritageEyebrow"),
        title: tHome("heritageTitle"),
        ctaLabel: tHome("heritageCta"),
        href: "/collections/heritage-capsule",
      },
    });
  }

  slots.push({
    kind: "panel",
    spec: {
      image: heroImage.src,
      alt: "",
      eyebrow: tHome("storyEyebrow"),
      title: tHome("storyTitle"),
      ctaLabel: tHome("storyCta"),
      href: "/about",
    },
  });

  // Still short of the target? Draw more individual product looks — heritage
  // pieces first, then anything else in the catalog — each its own panel
  // with a link straight to that product.
  const usedProductSlugs = new Set<string>(
    newArrivals[0] ? [newArrivals[0].slug] : [],
  );
  for (const p of [...heritageProducts, ...allProducts]) {
    if (slots.length >= PANEL_COUNT) break;
    if (usedProductSlugs.has(p.slug) || p.giftCard) continue;
    const img = p.images[0];
    if (!img) continue;
    usedProductSlugs.add(p.slug);
    const inHeritage = p.collectionSlugs.includes("heritage-capsule");
    slots.push({
      kind: "panel",
      spec: {
        image: img.src,
        alt: pick(img.alt, locale),
        eyebrow:
          inHeritage && heritage
            ? pick(heritage.title, locale)
            : tHome("newEyebrow"),
        title: pick(p.title, locale),
        ctaLabel: tHome("viewAll"),
        href: `/products/${p.slug}`,
      },
    });
  }

  const finalSlots = slots.slice(0, PANEL_COUNT);

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
      {/* ---------------- Hero: full-screen film ----------------
          Pulled up under the sticky header so the transparent bar overlays
          the media (negative margin lives on AlbumScroll's viewport now).
          AlbumScroll clips this and the panels below into one stack: each
          photo slides up and lands completely on top of the one before it. */}
      <section className="relative h-[100svh] overflow-hidden bg-ink text-paper">
        <HeroMedia poster={heroImage} videoSrc="/hero.mp4" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/5 to-transparent"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-9 flex flex-col items-center gap-4">
          <Link
            href="/collections"
            className="hero-enter text-eyebrow link-underline pointer-events-auto text-paper/85 hover:text-paper"
          >
            {t("discover")}
          </Link>
          <span aria-hidden="true" className="scroll-cue" />
        </div>
      </section>

      {/* ---------------- Five album panels ---------------- */}
      {finalSlots.map((slot, i) =>
        slot.kind === "split" ? (
          <SplitPanel
            key={`split-${i}`}
            left={{
              image: slot.left.image,
              alt: slot.left.alt,
              label: slot.left.title,
              cta: slot.left.ctaLabel,
              href: slot.left.href,
            }}
            right={{
              image: slot.right.image,
              alt: slot.right.alt,
              label: slot.right.title,
              cta: slot.right.ctaLabel,
              href: slot.right.href,
            }}
          />
        ) : (
          <FullBleedPanel
            key={`panel-${i}`}
            image={slot.spec.image}
            alt={slot.spec.alt}
            eyebrow={slot.spec.eyebrow}
            title={slot.spec.title}
            ctaLabel={slot.spec.ctaLabel}
            href={slot.spec.href}
            priority={i === 0}
          />
        ),
      )}

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
