import "server-only";
import { sql } from "@/lib/db/client";
import { applyFilter, applySort } from "../filter-sort";
import type {
  Collection,
  Post,
  PostBlock,
  Product,
  ProductColor,
  ProductFilter,
  ProductImage,
  ProductSort,
  ProductVariant,
  Review,
} from "../types";
import type { CatalogProvider } from "../index";
import type { LocalizedString } from "@/lib/content";

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
  colors: ProductColor[];
  images: { url: string; alt: LocalizedString }[];
  collection_slugs: string[];
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
  theme: "dark" | "light";
  archived: boolean;
  sort_order: number;
}

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
  body: PostBlock[];
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
    colors: row.colors ?? [],
    variants: variants
      .filter((v) => v.product_id === row.id)
      .map((v): ProductVariant => ({ id: v.id, size: v.size, stock: v.stock })),
    images: (row.images ?? []).map(toImage),
    collectionSlugs: row.collection_slugs ?? [],
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
    theme: row.theme,
    archived: row.archived,
    order: row.sort_order,
  };
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
    body: row.body ?? [],
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

export const postgresProvider: CatalogProvider = {
  async getProducts(filter?: ProductFilter, sort?: ProductSort) {
    const [rows, variants, reviews] = await Promise.all([
      sql<ProductRow[]>`select * from products where archived = false`,
      fetchAllVariants(),
      fetchApprovedReviews(),
    ]);
    const products = rows.map((r) => toProduct(r, variants, reviews));
    return applySort(applyFilter(products, filter), sort);
  },

  async getProduct(slug: string) {
    const [rows, variants, reviews] = await Promise.all([
      sql<ProductRow[]>`select * from products where slug = ${slug} limit 1`,
      fetchAllVariants(),
      fetchApprovedReviews(),
    ]);
    const row = rows[0];
    return row ? toProduct(row, variants, reviews) : undefined;
  },

  async getCollections() {
    const rows = await sql<CollectionRow[]>`
      select * from collections order by sort_order asc
    `;
    return rows.map(toCollection);
  },

  async getCollection(slug: string) {
    const rows = await sql<CollectionRow[]>`
      select * from collections where slug = ${slug} limit 1
    `;
    return rows[0] ? toCollection(rows[0]) : undefined;
  },

  async getPosts() {
    const rows = await sql<PostRow[]>`
      select * from posts order by post_date desc
    `;
    return rows.map(toPost);
  },

  async getPost(slug: string) {
    const rows = await sql<PostRow[]>`
      select * from posts where slug = ${slug} limit 1
    `;
    return rows[0] ? toPost(rows[0]) : undefined;
  },
};
