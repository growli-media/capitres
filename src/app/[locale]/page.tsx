import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { routing } from "@/i18n/routing";
import type { ImageProps } from "next/image";
import HeroMedia from "@/components/layout/HeroMedia";
import FullBleedPanel from "@/components/layout/FullBleedPanel";
import SplitPanel from "@/components/layout/SplitPanel";
import AlbumScroll from "@/components/layout/AlbumScroll";
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

const PANEL_COUNT = 5; // + hero = 6 full-screen sections = six scrolls to the footer

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tHome, collections, newArrivals, heritageProducts] =
    await Promise.all([
      getTranslations({ locale, namespace: "hero" }),
      getTranslations({ locale, namespace: "home" }),
      catalog.getCollections(),
      catalog.getProducts({ isNew: true }, "newest"),
      catalog.getProducts({ collection: "heritage-capsule" }, "featured"),
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

  // Still short of the target? Draw more looks from heritage products.
  for (const p of heritageProducts) {
    if (slots.length >= PANEL_COUNT) break;
    const img = p.images[0];
    if (!img) continue;
    slots.push({
      kind: "panel",
      spec: {
        image: img.src,
        alt: pick(img.alt, locale),
        eyebrow: heritage ? pick(heritage.title, locale) : tHome("heritageEyebrow"),
        title: pick(p.title, locale),
        ctaLabel: tHome("viewAll"),
        href: `/products/${p.slug}`,
      },
    });
  }

  const finalSlots = slots.slice(0, PANEL_COUNT);

  return (
    <AlbumScroll className="-mt-16 md:-mt-[4.75rem]">
      {/* ---------------- Hero: full-screen film ----------------
          Pulled up under the sticky header so the transparent bar overlays
          the media (negative margin lives on AlbumScroll's viewport now).
          AlbumScroll clips this and the panels below into one stack: each
          photo slides up and lands completely on top of the one before it.
          Drop a campaign film at /public/hero.mp4 and add videoSrc="/hero.mp4". */}
      <section className="relative h-[100svh] overflow-hidden bg-ink text-paper">
        <HeroMedia poster={heroImage} /* videoSrc="/hero.mp4" */ />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-ink/40"
        />
        <div className="container-x relative flex h-full flex-col justify-end pb-24 pt-32">
          <p className="hero-enter text-eyebrow mb-5 text-paper/75">
            {t("eyebrow")}
          </p>
          <h1 className="hero-enter hero-enter-2 text-display max-w-5xl text-[clamp(2.9rem,9vw,8rem)]">
            {t("titleA")}
            <br />
            <span className="text-paper/80">{t("titleB")}</span>
          </h1>
          <p className="hero-enter hero-enter-3 mt-6 max-w-md text-base text-paper/75 md:text-lg">
            {t("sub")}
          </p>
          <div className="hero-enter hero-enter-4 mt-9 flex flex-wrap gap-3">
            <Link href="/collections/heritage-capsule" className="btn btn-paper">
              {t("ctaShop")}
            </Link>
            <Link
              href="/about"
              className="btn btn-outline border-paper/60 text-paper hover:border-paper"
            >
              {t("ctaStory")}
            </Link>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center"
        >
          <span className="scroll-cue" />
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
    </AlbumScroll>
  );
}
