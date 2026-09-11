import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db/client";
import { dbReadCategories } from "../categories";
import { applyFilter, applySort } from "../filter-sort";
import { compareSizes } from "@/lib/commerce/filters";
import type {
  Collection,
  Currency,
  Post,
  PostBlock,
  Product,
  ProductColor,
  ProductFilter,
  ProductImage,
  ProductSort,
  ProductVariant,
  Review,
  SizeChartRow,
} from "../types";
import type { CatalogProvider } from "../index";
import type { LocalizedString } from "@/lib/content";
import { convertFromIqd } from "@/lib/money";

/* ---------------------------------------------------------------- */
/* Row shapes (snake_case, jsonb columns typed loosely on the way in) */
/* ---------------------------------------------------------------- */

interface ProductRow {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  title_ku: string;
  description_en: string;
  description_ar: string;
  description_ku: string;
  story_en: string | null;
  story_ar: string | null;
  story_ku: string | null;
  details: LocalizedString[];
  category: Product["category"];
  gender: Product["gender"];
  price_amount: number;
  compare_at_amount: number | null;
  price_amount_usd_cents: number | null;
  compare_at_amount_usd_cents: number | null;
  price_amount_eur_cents: number | null;
  compare_at_amount_eur_cents: number | null;
  colors: ProductColor[];
  images: { url: string; alt: LocalizedString }[];
  size_chart: SizeChartRow[];
  collection_slugs: string[];
  related_product_slugs: string[];
  is_new: boolean;
  featured: boolean;
  release_date: string | Date;
  giftcard_denominations: number[] | null;
  archived: boolean;
}

interface VariantRow {
  id: string;
  product_id: string;
  size: string;
  stock: number;
}

interface ReviewRow {
  id: string;
  product_slug: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  created_at: string;
}

interface CollectionRow {
  slug: string;
  title_en: string;
  title_ar: string;
  title_ku: string;
  tagline_en: string;
  tagline_ar: string;
  tagline_ku: string;
  description_en: string;
  description_ar: string;
  description_ku: string;
  hero_image: { url: string; alt: LocalizedString };
  hero_images: { url: string; alt: LocalizedString }[] | null;
  video_url: string | null;
  text_align_en: string;
  text_align_ar: string;
  text_align_ku: string;
  published_date: string | Date | null;
  published_where: string | null;
  theme: "dark" | "light";
  archived: boolean;
  sort_order: number;
}

/** Body blocks as stored in the `posts.body` jsonb column — image/video
 * blocks carry a plain `{url, alt}` there, same as `cover` does, not the
 * `ProductImage` (`{src, alt}`) shape the public Post type uses. */
type RawPostBlock =
  | { type: "p"; text: LocalizedString }
  | { type: "h2"; text: LocalizedString }
  | { type: "quote"; text: LocalizedString; attribution?: LocalizedString }
  | { type: "image"; image: { url: string; alt: LocalizedString } }
  | { type: "video"; url: string; poster?: { url: string; alt: LocalizedString } }
  | { type: "link"; url: string; label: LocalizedString };

interface PostRow {
  slug: string;
  title_en: string;
  title_ar: string;
  title_ku: string;
  excerpt_en: string;
  excerpt_ar: string;
  excerpt_ku: string;
  cover: { url: string; alt: LocalizedString };
  post_date: string | Date;
  reading_minutes: number;
  author: string;
  body: RawPostBlock[];
  related_product_slugs: string[];
}

function toImage(img: { url: string; alt: LocalizedString }): ProductImage {
  return { src: img.url, alt: img.alt };
}

function loc(en: string, ar: string, ku: string): LocalizedString {
  return { en, ar, ku };
}

/**
 * postgres.js returns `date` columns as JS Date objects (parsed in local
 * time), but the domain model treats release/post dates as plain
 * "YYYY-MM-DD" strings (compared with localeCompare, never time-zoned).
 * Normalize either shape to that string form.
 */
function dateOnly(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

/**
 * Every product needs a price to show in every currency. Use the admin's
 * explicit price when they've set one; otherwise fall back to a computed
 * conversion from the IQD amount, so nothing ever shows blank while an
 * admin hasn't gotten around to pricing it in USD/EUR yet.
 */
function priceByCurrencyOf(row: ProductRow): Record<Currency, number> {
  return {
    IQD: row.price_amount,
    USD: row.price_amount_usd_cents ?? convertFromIqd(row.price_amount, "USD"),
    EUR: row.price_amount_eur_cents ?? convertFromIqd(row.price_amount, "EUR"),
  };
}

/**
 * Unlike price, a "was" price is never auto-computed — showing a sale
 * badge is a deliberate call, only made for a currency the admin actually
 * set one for.
 */
function compareAtPriceByCurrencyOf(
  row: ProductRow,
): Partial<Record<Currency, number>> | undefined {
  const out: Partial<Record<Currency, number>> = {};
  if (row.compare_at_amount != null) out.IQD = row.compare_at_amount;
  if (row.compare_at_amount_usd_cents != null) out.USD = row.compare_at_amount_usd_cents;
  if (row.compare_at_amount_eur_cents != null) out.EUR = row.compare_at_amount_eur_cents;
  return Object.keys(out).length > 0 ? out : undefined;
}

function toProduct(
  row: ProductRow,
  variants: VariantRow[],
  reviews: ReviewRow[],
): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: loc(row.title_en, row.title_ar, row.title_ku),
    description: loc(row.description_en, row.description_ar, row.description_ku),
    story:
      row.story_en || row.story_ar || row.story_ku
        ? loc(row.story_en ?? "", row.story_ar ?? "", row.story_ku ?? "")
        : undefined,
    details: row.details ?? [],
    category: row.category,
    gender: row.gender,
    price: { amount: row.price_amount, currency: "IQD" },
    compareAtPrice:
      row.compare_at_amount != null
        ? { amount: row.compare_at_amount, currency: "IQD" }
        : undefined,
    priceByCurrency: priceByCurrencyOf(row),
    compareAtPriceByCurrency: compareAtPriceByCurrencyOf(row),
    colors: row.colors ?? [],
    variants: variants
      .filter((v) => v.product_id === row.id)
      .map((v): ProductVariant => ({ id: v.id, size: v.size, stock: v.stock }))
      .sort((a, b) => compareSizes(a.size, b.size)),
    images: (row.images ?? []).map(toImage),
    sizeChart: row.size_chart ?? [],
    collectionSlugs: row.collection_slugs ?? [],
    relatedProductSlugs: row.related_product_slugs ?? [],
    isNew: row.is_new,
    featured: row.featured,
    releaseDate: dateOnly(row.release_date),
    reviews: reviews
      .filter((r) => r.product_slug === row.slug)
      .map(
        (r): Review => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          date: r.created_at.slice(0, 10),
          text: r.body,
        }),
      ),
    giftCard: row.giftcard_denominations
      ? { denominations: row.giftcard_denominations }
      : undefined,
  };
}

function toCollection(row: CollectionRow): Collection {
  return {
    slug: row.slug,
    title: loc(row.title_en, row.title_ar, row.title_ku),
    tagline: loc(row.tagline_en, row.tagline_ar, row.tagline_ku),
    description: loc(row.description_en, row.description_ar, row.description_ku),
    heroImage: toImage(row.hero_image),
    heroImages: (row.hero_images ?? []).map(toImage),
    videoUrl: row.video_url ?? undefined,
    textAlign: loc(row.text_align_en, row.text_align_ar, row.text_align_ku),
    publishedDate: row.published_date ? dateOnly(row.published_date) : undefined,
    publishedWhere: row.published_where ?? undefined,
    theme: row.theme,
    archived: row.archived,
    order: row.sort_order,
  };
}

/** image/video blocks are stored as plain {url, alt} (see RawPostBlock) —
 * run them through the same toImage() the cover uses so the renderer's
 * block.image.src / block.poster.src reads actually resolve, instead of
 * silently rendering a broken image (the bug this fixes). */
function toPostBlock(b: RawPostBlock): PostBlock {
  if (b.type === "image") return { type: "image", image: toImage(b.image) };
  if (b.type === "video") {
    return { type: "video", url: b.url, poster: b.poster ? toImage(b.poster) : undefined };
  }
  return b;
}

function toPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: loc(row.title_en, row.title_ar, row.title_ku),
    excerpt: loc(row.excerpt_en, row.excerpt_ar, row.excerpt_ku),
    cover: toImage(row.cover),
    date: dateOnly(row.post_date),
    readingMinutes: row.reading_minutes,
    author: row.author,
    body: (row.body ?? []).map(toPostBlock),
    relatedProductSlugs: row.related_product_slugs ?? [],
  };
}

/** Only approved reviews are attached to a product's public review list. */
async function fetchApprovedReviews(): Promise<ReviewRow[]> {
  return sql<ReviewRow[]>`
    select id, product_slug, author, rating, body, created_at::text
    from reviews
    where approved = true
    order by created_at desc
  `;
}

async function fetchAllVariants(): Promise<VariantRow[]> {
  return sql<VariantRow[]>`select id, product_id, size, stock from product_variants`;
}

/** Catalog reads that fire on effectively every storefront page (the root
 * layout calls getCollections/getCategories for the header on EVERY
 * navigation; the shop page's getProducts pulls every product/variant/
 * review row regardless of which filter was actually requested, since
 * filtering happens in memory below) were each a fresh, uncached round
 * trip to Postgres — confirmed via curl to cost 0.5-2.5s per hit. Wrapping
 * the raw fetches in unstable_cache cuts that to one DB hit per window
 * instead of one per request; a short revalidate (not tag-based
 * invalidation) is the deliberate tradeoff here — an admin edit can take
 * up to this long to reach the storefront, which is fine for a catalog
 * that changes rarely, in exchange for not having to wire cache
 * invalidation into every product/collection/category/review mutation. */
const CATALOG_REVALIDATE_SECONDS = 60;

const getCachedAllProductRows = unstable_cache(
  async () => {
    const [rows, variants, reviews] = await Promise.all([
      sql<ProductRow[]>`select * from products where archived = false`,
      fetchAllVariants(),
      fetchApprovedReviews(),
    ]);
    return { rows, variants, reviews };
  },
  ["catalog:products:all"],
  { revalidate: CATALOG_REVALIDATE_SECONDS },
);

const getCachedCollectionRows = unstable_cache(
  async () => sql<CollectionRow[]>`select * from collections order by sort_order asc`,
  ["catalog:collections:all"],
  { revalidate: CATALOG_REVALIDATE_SECONDS },
);

const getCachedStorefrontCategories = unstable_cache(
  async () => dbReadCategories(false),
  ["catalog:categories:storefront"],
  { revalidate: CATALOG_REVALIDATE_SECONDS },
);

export const postgresProvider: CatalogProvider = {
  async getProducts(filter?: ProductFilter, sort?: ProductSort) {
    const { rows, variants, reviews } = await getCachedAllProductRows();
    const products = rows.map((r) => toProduct(r, variants, reviews));
    return applySort(applyFilter(products, filter), sort);
  },

  async getProduct(slug: string) {
    // The specific product row stays a fresh, uncached lookup (a single
    // product page benefits less from caching, and price/stock accuracy
    // matters more there) — only the variants/reviews it's joined against
    // reuse the cached full-catalog fetch above.
    const [rows, { variants, reviews }] = await Promise.all([
      sql<ProductRow[]>`select * from products where slug = ${slug} limit 1`,
      getCachedAllProductRows(),
    ]);
    const row = rows[0];
    return row ? toProduct(row, variants, reviews) : undefined;
  },

  /** Resolves admin-picked "frequently bought together" slugs into full
   * Product objects, in the same order they were picked (the `= any()`
   * query doesn't preserve input order, so re-sort against `slugs`
   * afterward) — excludes archived products, unlike getProduct's direct
   * single-slug lookup above, since this is a "show these as
   * suggestions" listing, not a shared-link lookup that must keep
   * working regardless of archived status. */
  async getProductsBySlugs(slugs: string[]) {
    if (slugs.length === 0) return [];
    const { rows, variants, reviews } = await getCachedAllProductRows();
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    return slugs
      .map((s) => bySlug.get(s))
      .filter((r): r is ProductRow => !!r)
      .map((r) => toProduct(r, variants, reviews));
  },

  async getCollections() {
    const rows = await getCachedCollectionRows();
    return rows.map(toCollection);
  },

  async getCollection(slug: string) {
    const rows = await sql<CollectionRow[]>`
      select * from collections where slug = ${slug} limit 1
    `;
    return rows[0] ? toCollection(rows[0]) : undefined;
  },

  async getCategories() {
    const rows = await getCachedStorefrontCategories();
    return rows.map(({ slug, title, sortOrder }) => ({ slug, title, sortOrder }));
  },

  async getPosts() {
    const rows = await sql<PostRow[]>`
      select * from posts where published = true order by post_date desc
    `;
    return rows.map(toPost);
  },

  async getPost(slug: string) {
    const rows = await sql<PostRow[]>`
      select * from posts where slug = ${slug} and published = true limit 1
    `;
    return rows[0] ? toPost(rows[0]) : undefined;
  },
};
