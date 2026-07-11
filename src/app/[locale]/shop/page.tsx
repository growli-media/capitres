import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { catalog } from "@/lib/catalog";
import type {
  Category,
  Gender,
  ProductFilter,
  ProductSort,
} from "@/lib/catalog/types";
import ProductCard from "@/components/product/ProductCard";
import ShopFilters, { type ColorOption } from "@/components/shop/ShopFilters";
import { PRICE_RANGES } from "@/lib/commerce/filters";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("shop") };
}

type ShopSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: ShopSearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const t = await getTranslations({ locale, namespace: "shop" });

  const categoryParam = first(sp.category);
  const genderParam = first(sp.gender);
  const priceParam = first(sp.price);
  const range = PRICE_RANGES.find((r) => r.id === priceParam);

  const filter: ProductFilter = {
    category: (categoryParam as Category | undefined) ?? "all",
    gender: genderParam as Gender | undefined,
    sizes: first(sp.sizes)?.split(",").filter(Boolean),
    colors: first(sp.colors)?.split(",").filter(Boolean),
    minPrice: range?.min,
    maxPrice: range?.max,
    inStockOnly: first(sp.instock) === "1",
    onSale: first(sp.sale) === "1" || undefined,
    isNew: first(sp.new) === "1" || undefined,
  };
  const sort = (first(sp.sort) as ProductSort | undefined) ?? "featured";

  const [products, allProducts] = await Promise.all([
    catalog.getProducts(filter, sort),
    catalog.getProducts(),
  ]);

  // Swatch options are derived from the live catalog, deduped by key.
  const colorMap = new Map<string, ColorOption>();
  for (const p of allProducts) {
    for (const c of p.colors) {
      if (!colorMap.has(c.key)) colorMap.set(c.key, c);
    }
  }

  return (
    <>
      <section className="container-x pb-8 pt-14 md:pb-12 md:pt-20">
        <p className="text-eyebrow mb-3 text-ink/60">{t("eyebrow")}</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-display text-5xl md:text-7xl">{t("title")}</h1>
          <p className="pb-1.5 text-sm text-ink/65">
            {t("results", { count: products.length })}
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="h-16 border-y border-line" />}>
        <ShopFilters colors={[...colorMap.values()]} />
      </Suspense>

      <section className="container-x py-10 md:py-14">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-display text-3xl">{t("empty")}</p>
            <Link href="/shop" className="btn btn-outline mt-2">
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
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
        )}
      </section>
    </>
  );
}
