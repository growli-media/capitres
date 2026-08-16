import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { routing } from "@/i18n/routing";
import HeroMedia from "@/components/layout/HeroMedia";
import FullBleedPanel from "@/components/layout/FullBleedPanel";
import HomeScrollSnap from "@/components/layout/HomeScrollSnap";
import heroImage from "@/images/brand/hero-editorial.jpg";

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
  // Collections shown as their own panels; heritage gets a dedicated one below.
  const collectionPanels = liveCollections.filter(
    (c) => c.slug !== "heritage-capsule",
  );
  const heritageImage =
    heritage?.heroImage.src ?? heritageProducts[0]?.images[0]?.src;

  return (
    <>
      <HomeScrollSnap />
      {/* ---------------- Hero: full-screen film ----------------
          Pulled up under the sticky header so the transparent bar overlays
          the media. Drop a campaign film at /public/hero.mp4 and add
          videoSrc="/hero.mp4" below to run motion; until then the poster
          carries a slow cinematic drift. */}
      <section className="snap-panel relative -mt-16 h-[100svh] overflow-hidden bg-ink text-paper md:-mt-[4.75rem]">
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

      {/* ---------------- Full-bleed scroll panels ----------------
          One full-viewport image per screen; scroll moves through them one
          at a time, each label fading up as it enters view, then the footer.*/}
      {collectionPanels.map((c, i) => (
        <FullBleedPanel
          key={c.slug}
          image={c.heroImage.src}
          alt={pick(c.heroImage.alt, locale)}
          eyebrow={pick(c.tagline, locale)}
          title={pick(c.title, locale)}
          ctaLabel={tHome("viewAll")}
          href={`/collections/${c.slug}`}
          priority={i === 0}
        />
      ))}

      {newArrivals[0]?.images[0] && (
        <FullBleedPanel
          image={newArrivals[0].images[0].src}
          alt={pick(newArrivals[0].images[0].alt, locale)}
          eyebrow={tHome("newEyebrow")}
          title={tHome("newTitle")}
          ctaLabel={tHome("viewAll")}
          href="/shop?new=1"
        />
      )}

      {heritage && heritageImage && (
        <FullBleedPanel
          image={heritageImage}
          alt={pick(heritage.heroImage.alt, locale)}
          eyebrow={tHome("heritageEyebrow")}
          title={tHome("heritageTitle")}
          ctaLabel={tHome("heritageCta")}
          href="/collections/heritage-capsule"
        />
      )}

      <FullBleedPanel
        image={heroImage.src}
        alt=""
        eyebrow={tHome("storyEyebrow")}
        title={tHome("storyTitle")}
        ctaLabel={tHome("storyCta")}
        href="/about"
      />
    </>
  );
}
