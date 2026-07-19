import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { SOCIAL } from "@/lib/site";
import { routing } from "@/i18n/routing";
import Marquee from "@/components/layout/Marquee";
import NewsletterForm from "@/components/layout/NewsletterForm";
import ProductCard from "@/components/product/ProductCard";
import {
  Parallax,
  ParallaxScale,
  Reveal,
  RevealGroup,
  RevealItem,
} from "@/components/motion/Reveal";
import heroImage from "@/images/brand/hero-editorial.jpg";
import wordmark from "@/images/brand/wordmark.png";

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

  const [t, tHome, tNews, collections, newArrivals, heritageProducts] =
    await Promise.all([
      getTranslations({ locale, namespace: "hero" }),
      getTranslations({ locale, namespace: "home" }),
      getTranslations({ locale, namespace: "newsletter" }),
      catalog.getCollections(),
      catalog.getProducts({ isNew: true }, "newest"),
      catalog.getProducts({ collection: "heritage-capsule" }, "featured"),
    ]);

  const liveCollections = collections.filter((c) => !c.archived);
  const heritage = collections.find((c) => c.slug === "heritage-capsule");

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <ParallaxScale className="absolute inset-0">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={45}
            className="object-cover object-[50%_30%] opacity-70"
          />
        </ParallaxScale>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/25"
        />
        <div className="container-x relative flex min-h-[92dvh] flex-col justify-end pb-14 pt-32 md:pb-20">
          <p className="hero-enter text-eyebrow mb-5 text-paper/70">
            {t("eyebrow")}
          </p>
          <h1 className="hero-enter hero-enter-2 text-display max-w-5xl text-[clamp(2.9rem,9.5vw,8.75rem)]">
            {t("titleA")}
            <br />
            <span className="text-paper/85">{t("titleB")}</span>
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
      </section>

      {/* ---------------- Ticker ---------------- */}
      <div className="border-y border-line bg-ink py-3.5 text-paper">
        <Marquee>
          <span className="text-eyebrow">{tHome("marquee")}</span>
          <span aria-hidden="true" className="text-green">
            ●
          </span>
          <span className="text-eyebrow">{tHome("marqueeAlt")}</span>
          <span aria-hidden="true" className="text-terracotta">
            ●
          </span>
        </Marquee>
      </div>

      {/* ---------------- Collections ---------------- */}
      <section className="container-x py-20 md:py-28">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
            <div>
              <p className="text-eyebrow mb-3 text-ink/60">
                {tHome("collectionsEyebrow")}
              </p>
              <h2 className="text-display text-4xl md:text-6xl">
                {tHome("collectionsTitle")}
              </h2>
            </div>
            <Link
              href="/collections"
              className="link-underline pb-1 text-sm font-bold"
            >
              {tHome("viewAll")}
            </Link>
          </div>
        </Reveal>

        <RevealGroup className="grid gap-5 md:grid-cols-3">
          {liveCollections.map((c, i) => (
            <RevealItem key={c.slug} className={i === 0 ? "md:col-span-1" : ""}>
              <Link
                href={`/collections/${c.slug}`}
                className="group block cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-studio">
                  <Image
                    src={c.heroImage.src}
                    alt={pick(c.heroImage.alt, locale)}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="text-display text-2xl text-paper md:text-3xl">
                      {pick(c.title, locale)}
                    </h3>
                    <p className="mt-1.5 line-clamp-1 text-sm text-paper/75">
                      {pick(c.tagline, locale)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-paper">
                      <span className="link-underline">{tHome("viewAll")}</span>
                      <ArrowUpRight
                        size={16}
                        aria-hidden="true"
                        className="rtl:-scale-x-100"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ---------------- New arrivals rail ---------------- */}
      <section className="border-t border-line py-20 md:py-28">
        <div className="container-x">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-eyebrow mb-3 text-ink/60">
                  {tHome("newEyebrow")}
                </p>
                <h2 className="text-display text-4xl md:text-6xl">
                  {tHome("newTitle")}
                </h2>
              </div>
              <Link
                href="/shop?new=1"
                className="link-underline pb-1 text-sm font-bold"
              >
                {tHome("viewAll")}
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal className="container-x">
          <ul className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2">
            {newArrivals.map((p, i) => (
              <li
                key={p.id}
                className="w-[74vw] shrink-0 snap-start sm:w-[42vw] lg:w-[29vw] xl:w-[22vw]"
              >
                <ProductCard
                  product={p}
                  priority={i === 0}
                  sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 29vw, (min-width: 640px) 42vw, 74vw"
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ---------------- Brand story ---------------- */}
      <section className="container-x grid items-center gap-10 border-t border-line py-20 md:grid-cols-2 md:gap-16 md:py-28">
        <Parallax amount={8} className="order-2 md:order-1">
          <div className="relative aspect-[4/5] bg-ink">
            <Image
              src={wordmark}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-contain p-8 md:p-12"
            />
          </div>
        </Parallax>
        <div className="order-1 md:order-2">
          <Reveal>
            <p className="text-eyebrow mb-3 text-ink/60">
              {tHome("storyEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="text-display text-4xl md:text-6xl">
              {tHome("storyTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-lg leading-relaxed text-ink/70">
              {tHome("storyBody")}
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <Link href="/about" className="btn btn-ink mt-8">
              {tHome("storyCta")}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Heritage spotlight (dark) ---------------- */}
      {heritage && (
        <section className="bg-ink py-20 text-paper md:py-28">
          <div className="container-x">
            <Reveal>
              <p className="text-eyebrow mb-3 text-green">
                {tHome("heritageEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="text-display max-w-4xl text-4xl md:text-6xl">
                {tHome("heritageTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-paper/70">
                {tHome("heritageBody")}
              </p>
            </Reveal>

            <RevealGroup className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {heritageProducts.slice(0, 4).map((p) => (
                <RevealItem key={p.id}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="group block cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-ink-soft">
                      <Image
                        src={p.images[0].src}
                        alt={pick(p.images[0].alt, locale)}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover opacity-90 transition duration-700 group-hover:scale-[1.05] group-hover:opacity-100"
                      />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-paper/90">
                      <span className="link-underline">
                        {pick(p.title, locale)}
                      </span>
                    </p>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.1}>
              <Link
                href="/collections/heritage-capsule"
                className="btn btn-paper mt-12"
              >
                {tHome("heritageCta")}
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------------- Instagram strip ---------------- */}
      <section className="py-20 md:py-28">
        <div className="container-x">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-eyebrow mb-3 text-ink/60">
                  {tHome("igEyebrow")}
                </p>
                <h2 className="text-display text-4xl md:text-6xl">
                  {tHome("igTitle")}
                </h2>
              </div>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline pb-1 text-sm font-bold"
              >
                {tHome("igCta")}
              </a>
            </div>
          </Reveal>
        </div>
        <RevealGroup className="container-x grid grid-cols-2 gap-1.5 md:grid-cols-4">
          {newArrivals
            .concat(heritageProducts)
            .slice(0, 4)
            .map((p) => (
              <RevealItem key={`ig-${p.id}`}>
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${SOCIAL.instagramHandle} — Instagram`}
                  className="group relative block aspect-square cursor-pointer overflow-hidden bg-studio"
                >
                  <Image
                    src={p.images[0].src}
                    alt={pick(p.images[0].alt, locale)}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04] group-hover:opacity-90"
                  />
                </a>
              </RevealItem>
            ))}
        </RevealGroup>
      </section>

      {/* ---------------- Newsletter ---------------- */}
      <section className="border-t border-line py-20 md:py-28">
        <div className="container-x grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div>
              <p className="text-eyebrow mb-3 text-ink/60">
                {tNews("eyebrow")}
              </p>
              <h2 className="text-display text-4xl md:text-5xl">
                {tNews("title")}
              </h2>
              <p className="mt-4 max-w-md text-ink/65">{tNews("body")}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="self-end">
            <NewsletterForm tone="paper" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
