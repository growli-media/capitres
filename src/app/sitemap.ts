import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { catalog } from "@/lib/catalog";
import { GIFT_CARDS_ENABLED } from "@/lib/commerce/config";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allProducts, collections, posts] = await Promise.all([
    catalog.getProducts(),
    catalog.getCollections(),
    catalog.getPosts(),
  ]);
  const products = GIFT_CARDS_ENABLED
    ? allProducts
    : allProducts.filter((p) => !p.giftCard);

  const staticPaths = [
    "",
    "/shop",
    "/collections",
    ...(GIFT_CARDS_ENABLED ? ["/gift-cards"] : []),
    "/blog",
    "/about",
    "/contact",
    "/size-guide",
    "/shipping-returns",
    "/privacy",
    "/terms",
  ];

  const dynamicPaths = [
    ...products.map((p) => `/products/${p.slug}`),
    ...collections.map((c) => `/collections/${c.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
  ];

  return [...staticPaths, ...dynamicPaths].flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${BASE}/${locale}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${BASE}/${l}${path}`]),
        ),
      },
    })),
  );
}
