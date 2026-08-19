import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { formatIQD } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD, GIFT_CARDS_ENABLED } from "@/lib/commerce/config";
import ProductCard from "@/components/product/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import AddToCart from "@/components/product/AddToCart";
import ProductReviews from "@/components/product/ProductReviews";
import { Reveal } from "@/components/motion/Reveal";

export async function generateStaticParams() {
  const products = await catalog.getProducts();
  const buildable = GIFT_CARDS_ENABLED
    ? products
    : products.filter((p) => !p.giftCard);
  return routing.locales.flatMap((locale) =>
    buildable.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await catalog.getProduct(slug);
  if (!product) return {};
  return {
    title: pick(product.title, locale),
    description: pick(product.description, locale),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await catalog.getProduct(slug);
  if (!product) notFound();
  if (product.giftCard && !GIFT_CARDS_ENABLED) notFound();

  const [t, tNav, tBadges, tA11y, related, primaryCollection] =
    await Promise.all([
      getTranslations({ locale, namespace: "product" }),
      getTranslations({ locale, namespace: "nav" }),
      getTranslations({ locale, namespace: "badges" }),
      getTranslations({ locale, namespace: "a11y" }),
      catalog.getProducts(
        product.collectionSlugs.length
          ? { collection: product.collectionSlugs[0] }
          : { category: product.category },
      ),
      product.collectionSlugs.length
        ? catalog.getCollection(product.collectionSlugs[0])
        : Promise.resolve(undefined),
    ]);

  const relatedProducts = related.filter((p) => p.id !== product.id).slice(0, 4);
  const reviews = product.reviews;
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10,
        ) / 10
      : null;

  const badge = product.isNew
    ? tBadges("new")
    : product.compareAtPrice
      ? tBadges("sale")
      : undefined;

  return (
    <>
      {/* Breadcrumb */}
      <nav
        aria-label={tA11y("breadcrumb")}
        className="container-x flex items-center gap-1.5 py-5 text-xs text-ink/65"
      >
        <Link href="/" className="link-underline hover:text-ink">
          {tNav("home")}
        </Link>
        <CaretRight size={10} aria-hidden="true" className="rtl:-scale-x-100" />
        <Link href="/shop" className="link-underline hover:text-ink">
          {tNav("shop")}
        </Link>
        <CaretRight size={10} aria-hidden="true" className="rtl:-scale-x-100" />
        <span aria-current="page" className="font-semibold text-ink">
          {pick(product.title, locale)}
        </span>
      </nav>

      {/* Product — three columns: info (fixed) | gallery (scrolls) | buy (fixed) */}
      <section className="container-x grid gap-10 pb-20 lg:grid-cols-[0.85fr_1.3fr_0.85fr] lg:gap-12 xl:gap-16">
        {/* Gallery — centre column, the only thing that scrolls */}
        <div className="order-1 lg:order-2">
          <ProductGallery images={product.images} badge={badge} />
        </div>

        {/* Left: the story — sticky, offset half a viewport down then pulled
            back up by half its own (content-sized, thanks to self-start —
            without it grid stretches this to the row height, which cancels
            the centring) height. Stays centred on screen for as long as the
            gallery scrolls, releasing into "You may also like" at the end —
            no JS. max-h + overflow-y guard against content taller than the
            screen spilling off it instead of centring. */}
        <div className="order-2 lg:sticky lg:top-[50vh] lg:order-1 lg:max-h-[100svh] lg:-translate-y-1/2 lg:self-start lg:overflow-y-auto">
          <p className="text-eyebrow text-ink/55">
            {primaryCollection
              ? pick(primaryCollection.title, locale)
              : tNav("shopAll")}
          </p>
          <h1 className="text-display mt-2 text-lg md:text-xl">
            {pick(product.title, locale)}
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/65">
            {pick(product.description, locale)}
          </p>

          {product.story && (
            <blockquote className="mt-8 max-w-sm border-s-2 border-ink bg-studio p-6">
              <p className="text-eyebrow mb-3 text-ink/60">{t("heritage")}</p>
              <p className="leading-relaxed text-ink/80">
                {pick(product.story, locale)}
              </p>
            </blockquote>
          )}
        </div>

        {/* Right: price, buy, size/care, reviews — same centred-sticky
            treatment as the left column (see the comment there for why
            self-start is load-bearing, not optional). */}
        <div className="order-3 lg:sticky lg:top-[50vh] lg:max-h-[100svh] lg:-translate-y-1/2 lg:self-start lg:overflow-y-auto">
          <AddToCart product={product} />

          {/* Accordions — size chart lives inside AddToCart; details/care and
              shipping/returns cover the rest */}
          <div className="mt-9 divide-y divide-line border-y border-line">
            <details className="group">
              <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between text-sm font-bold uppercase tracking-cta">
                {t("detailsTitle")}
                <span
                  aria-hidden="true"
                  className="text-lg transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <ul className="space-y-2 pb-5 text-sm leading-relaxed text-ink/70">
                {product.details.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="text-ink/40">
                      —
                    </span>
                    {pick(d, locale)}
                  </li>
                ))}
              </ul>
            </details>
            <details className="group">
              <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between text-sm font-bold uppercase tracking-cta">
                {t("shippingTitle")}
                <span
                  aria-hidden="true"
                  className="text-lg transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-ink/70">
                {t("shippingBody", {
                  threshold: formatIQD(FREE_SHIPPING_THRESHOLD, locale),
                })}
              </p>
            </details>
          </div>

          {/* Reviews — five stars only; opens a popup to read / write */}
          <div className="mt-8 border-t border-line pt-6">
            <ProductReviews
              productSlug={product.slug}
              reviews={reviews}
              avgRating={avgRating}
            />
          </div>
        </div>
      </section>

      {/* Related */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-line py-16 md:py-24">
          <div className="container-x">
            <Reveal>
              <h2 className="text-display mb-10 text-3xl md:text-4xl">
                {t("related")}
              </h2>
            </Reveal>
            <ul className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2">
              {relatedProducts.map((p) => (
                <li
                  key={p.id}
                  className="w-[68vw] shrink-0 snap-start sm:w-[42vw] lg:w-[29vw] xl:w-[23vw]"
                >
                  <ProductCard
                    product={p}
                    sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 29vw, (min-width: 640px) 42vw, 68vw"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
