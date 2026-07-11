import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaretRight, Star } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { formatIQD, localizeDigits } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/commerce/config";
import ProductCard from "@/components/product/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import AddToCart from "@/components/product/AddToCart";
import ReviewForm from "@/components/product/ReviewForm";
import { Reveal } from "@/components/motion/Reveal";

export async function generateStaticParams() {
  const products = await catalog.getProducts();
  return routing.locales.flatMap((locale) =>
    products.map((p) => ({ locale, slug: p.slug })),
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

      {/* Product */}
      <section className="container-x grid gap-10 pb-20 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} badge={badge} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-eyebrow text-ink/60">
            {primaryCollection
              ? pick(primaryCollection.title, locale)
              : tNav("shopAll")}
          </p>
          <h1 className="text-display mt-2 text-4xl md:text-5xl">
            {pick(product.title, locale)}
          </h1>

          <p className="mt-5 leading-relaxed text-ink/70">
            {pick(product.description, locale)}
          </p>

          <div className="mt-7">
            <AddToCart product={product} />
          </div>

          {/* Accordions */}
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
                    <span aria-hidden="true" className="text-green">
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

          {/* Heritage story */}
          {product.story && (
            <blockquote className="mt-9 border-s-2 border-green bg-studio p-6">
              <p className="text-eyebrow mb-3 text-green">{t("heritage")}</p>
              <p className="leading-relaxed text-ink/80">
                {pick(product.story, locale)}
              </p>
            </blockquote>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-line py-16 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="text-display text-3xl md:text-4xl">
              {t("reviews")}
            </h2>
            <div className="mt-3 flex items-center gap-3">
              {avgRating !== null && (
                <span
                  role="img"
                  className="flex items-center gap-1"
                  aria-label={t("stars", {
                    count: localizeDigits(avgRating, locale),
                  })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={16}
                      weight={avgRating >= n - 0.25 ? "fill" : "regular"}
                      aria-hidden="true"
                    />
                  ))}
                </span>
              )}
              <p className="text-sm text-ink/65">
                {t("reviewsCount", { count: reviews.length })}
              </p>
            </div>

            <ul className="mt-8 space-y-7">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-line pb-7">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold">{r.author}</p>
                    <span
                      role="img"
                      className="flex gap-0.5"
                      aria-label={t("stars", {
                        count: localizeDigits(r.rating, locale),
                      })}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={13}
                          weight={r.rating >= n ? "fill" : "regular"}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink/60">
                    {localizeDigits(r.date, locale)}
                  </p>
                  <p className="mt-3 leading-relaxed text-ink/75">{r.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:pt-14">
            <h3 className="text-eyebrow mb-6 text-ink/60">
              {t("writeReview")}
            </h3>
            <ReviewForm productSlug={product.slug} />
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
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <li key={p.id}>
                  <ProductCard
                    product={p}
                    sizes="(min-width: 1024px) 25vw, 50vw"
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
