import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import ProductCard from "@/components/product/ProductCard";
import NewsletterForm from "@/components/layout/NewsletterForm";
import { ParallaxScale, Reveal } from "@/components/motion/Reveal";

export async function generateStaticParams() {
  const collections = await catalog.getCollections();
  return routing.locales.flatMap((locale) =>
    collections.map((c) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const collection = await catalog.getCollection(slug);
  if (!collection) return {};
  return {
    title: pick(collection.title, locale),
    description: pick(collection.description, locale),
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const collection = await catalog.getCollection(slug);
  if (!collection) notFound();

  const [t, products] = await Promise.all([
    getTranslations({ locale, namespace: "collectionsPage" }),
    catalog.getProducts({ collection: slug }, "featured"),
  ]);

  return (
    <>
      {/* Collection hero */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <ParallaxScale className="absolute inset-0">
          <Image
            src={collection.heroImage.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
        </ParallaxScale>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/25"
        />
        <div className="container-x relative flex min-h-[62dvh] flex-col justify-end pb-12 pt-32 md:min-h-[70dvh] md:pb-16">
          <Reveal>
            <p className="text-eyebrow mb-4 text-green">
              {t("eyebrow")}
              {collection.archived ? ` — ${t("archived")}` : ""}
            </p>
          </Reveal>
          <Reveal delay={0.07}>
            <h1 className="text-display max-w-4xl text-[clamp(2.5rem,7.5vw,6.5rem)]">
              {pick(collection.title, locale)}
            </h1>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mt-5 max-w-xl text-paper/80 md:text-lg">
              {pick(collection.tagline, locale)}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Description strip */}
      <section className="container-x border-b border-line py-10 md:py-14">
        <Reveal>
          <p className="max-w-3xl text-lg leading-relaxed text-ink/75 md:text-xl">
            {pick(collection.description, locale)}
          </p>
        </Reveal>
      </section>

      {/* Products or archived story */}
      {collection.archived || products.length === 0 ? (
        <section className="container-x py-20 md:py-28">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-display text-3xl md:text-4xl">
              {t("archived")}
            </h2>
            <p className="mt-4 text-ink/65">{t("archivedBody")}</p>
            <div className="mt-10 text-start">
              <NewsletterForm tone="paper" />
            </div>
          </div>
        </section>
      ) : (
        <section className="container-x py-12 md:py-16">
          <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  priority={i < 4}
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                />
              </li>
            ))}
          </ul>
          <div className="mt-14 text-center">
            <Link href="/shop" className="btn btn-outline">
              {t("shopCollection")}
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
