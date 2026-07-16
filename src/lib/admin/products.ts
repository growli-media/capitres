import "server-only";
import { sql, jsonb } from "@/lib/db/client";
import type { Category, Gender } from "@/lib/catalog/types";

/** Flat, admin-facing view of a product row — no locale picking, no
 * variant/review joins beyond what the list/edit screens need. */
export interface AdminProductRow {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionKu: string;
  category: Category;
  gender: Gender;
  priceAmount: number;
  compareAtAmount: number | null;
  images: { url: string; alt: { en: string; ar: string; ku: string } }[];
  colors: { key: string; hex: string; name: { en: string; ar: string; ku: string } }[];
  collectionSlugs: string[];
  details: { en: string; ar: string; ku: string }[];
  isNew: boolean;
  featured: boolean;
  archived: boolean;
  releaseDate: string;
  giftcardDenominations: number[] | null;
  totalStock: number;
}

export interface AdminVariant {
  id: string;
  size: string;
  stock: number;
}

interface ProductListRow {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  title_ku: string;
  description_en: string;
  description_ar: string;
  description_ku: string;
  category: Category;
  gender: Gender;
  price_amount: number;
  compare_at_amount: number | null;
  images: AdminProductRow["images"];
  colors: AdminProductRow["colors"];
  collection_slugs: string[];
  details: AdminProductRow["details"];
  is_new: boolean;
  featured: boolean;
  archived: boolean;
  release_date: string | Date;
  giftcard_denominations: number[] | null;
  total_stock: string;
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  const rows = await sql<ProductListRow[]>`
    select p.*,
           coalesce(sum(v.stock), 0)::text as total_stock
    from products p
    left join product_variants v on v.product_id = p.id
    group by p.id
    order by p.created_at desc
  `;
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    titleEn: r.title_en,
    titleAr: r.title_ar,
    titleKu: r.title_ku,
    descriptionEn: r.description_en,
    descriptionAr: r.description_ar,
    descriptionKu: r.description_ku,
    category: r.category,
    gender: r.gender,
    priceAmount: r.price_amount,
    compareAtAmount: r.compare_at_amount,
    images: r.images ?? [],
    colors: r.colors ?? [],
    collectionSlugs: r.collection_slugs ?? [],
    details: r.details ?? [],
    isNew: r.is_new,
    featured: r.featured,
    archived: r.archived,
    releaseDate: dateOnly(r.release_date),
    giftcardDenominations: r.giftcard_denominations,
    totalStock: Number(r.total_stock ?? 0),
  }));
}

function dateOnly(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

export async function getAdminProduct(
  id: string,
): Promise<{ product: AdminProductRow; variants: AdminVariant[] } | undefined> {
  const [rows, variants] = await Promise.all([
    sql<
      {
        id: string;
        slug: string;
        title_en: string;
        title_ar: string;
        title_ku: string;
        description_en: string;
        description_ar: string;
        description_ku: string;
        category: Category;
        gender: Gender;
        price_amount: number;
        compare_at_amount: number | null;
        images: AdminProductRow["images"];
        colors: AdminProductRow["colors"];
        collection_slugs: string[];
        details: AdminProductRow["details"];
        is_new: boolean;
        featured: boolean;
        archived: boolean;
        release_date: string | Date;
        giftcard_denominations: number[] | null;
      }[]
    >`select * from products where id = ${id} limit 1`,
    sql<AdminVariant[]>`
      select id, size, stock from product_variants where product_id = ${id} order by size
    `,
  ]);
  const row = rows[0];
  if (!row) return undefined;
  return {
    product: {
      id: row.id,
      slug: row.slug,
      titleEn: row.title_en,
      titleAr: row.title_ar,
      titleKu: row.title_ku,
      descriptionEn: row.description_en,
      descriptionAr: row.description_ar,
      descriptionKu: row.description_ku,
      category: row.category,
      gender: row.gender,
      priceAmount: row.price_amount,
      compareAtAmount: row.compare_at_amount,
      images: row.images ?? [],
      colors: row.colors ?? [],
      collectionSlugs: row.collection_slugs ?? [],
      details: row.details ?? [],
      isNew: row.is_new,
      featured: row.featured,
      archived: row.archived,
      releaseDate: dateOnly(row.release_date),
      giftcardDenominations: row.giftcard_denominations,
      totalStock: variants.reduce((s, v) => s + v.stock, 0),
    },
    variants,
  };
}

export async function slugExists(slug: string, excludingId?: string): Promise<boolean> {
  const rows = excludingId
    ? await sql<{ id: string }[]>`select id from products where slug = ${slug} and id != ${excludingId} limit 1`
    : await sql<{ id: string }[]>`select id from products where slug = ${slug} limit 1`;
  return rows.length > 0;
}

/* -------------------------- mutations -------------------------- */

export interface ColorInput {
  hex: string;
  nameEn: string;
  nameAr: string;
  nameKu: string;
}

export interface ImageInput {
  url: string;
  altEn: string;
  altAr: string;
  altKu: string;
}

export interface ProductInput {
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionKu: string;
  detailsEn: string[];
  detailsAr: string[];
  detailsKu: string[];
  category: Category;
  gender: Gender;
  priceAmount: number;
  compareAtAmount: number | null;
  colors: ColorInput[];
  images: ImageInput[];
  collectionSlugs: string[];
  isNew: boolean;
  featured: boolean;
  giftcardDenominations: number[] | null;
  variants: { size: string; stock: number }[];
}

function buildDetails(input: ProductInput) {
  const len = Math.max(input.detailsEn.length, input.detailsAr.length, input.detailsKu.length);
  return Array.from({ length: len }, (_, i) => ({
    en: input.detailsEn[i] ?? "",
    ar: input.detailsAr[i] ?? "",
    ku: input.detailsKu[i] ?? "",
  }));
}

function buildColors(input: ProductInput) {
  // The <input type="color"> always submits a value (defaults to
  // #000000), so it can't signal "no color was entered" — the English
  // name field is the real signal of intent.
  const seenKeys = new Set<string>();
  return input.colors
    .filter((c) => c.nameEn.trim())
    .map((c) => {
      const base = c.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "color";
      let key = base;
      let n = 2;
      while (seenKeys.has(key)) key = `${base}-${n++}`;
      seenKeys.add(key);
      return {
        key,
        hex: c.hex,
        name: { en: c.nameEn, ar: c.nameAr, ku: c.nameKu },
      };
    });
}

function buildImages(input: ProductInput) {
  return input.images
    .filter((img) => img.url.trim())
    .map((img) => ({
      url: img.url,
      alt: { en: img.altEn, ar: img.altAr, ku: img.altKu },
    }));
}

export async function createProduct(input: ProductInput): Promise<string> {
  const id = `p_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  await sql`
    insert into products (
      id, slug, title_en, title_ar, title_ku,
      description_en, description_ar, description_ku,
      details, category, gender, price_amount, compare_at_amount,
      colors, images, collection_slugs, is_new, featured, giftcard_denominations
    ) values (
      ${id}, ${input.slug}, ${input.titleEn}, ${input.titleAr}, ${input.titleKu},
      ${input.descriptionEn}, ${input.descriptionAr}, ${input.descriptionKu},
      ${jsonb(buildDetails(input))}, ${input.category}, ${input.gender},
      ${input.priceAmount}, ${input.compareAtAmount},
      ${jsonb(buildColors(input))}, ${jsonb(buildImages(input))},
      ${jsonb(input.collectionSlugs)}, ${input.isNew}, ${input.featured},
      ${input.giftcardDenominations ? jsonb(input.giftcardDenominations) : null}
    )
  `;
  for (const v of input.variants) {
    await sql`
      insert into product_variants (id, product_id, size, stock)
      values (${`${id}-${v.size}`}, ${id}, ${v.size}, ${v.stock})
    `;
  }
  return id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await sql`
    update products set
      title_en = ${input.titleEn}, title_ar = ${input.titleAr}, title_ku = ${input.titleKu},
      description_en = ${input.descriptionEn}, description_ar = ${input.descriptionAr},
      description_ku = ${input.descriptionKu},
      details = ${jsonb(buildDetails(input))},
      category = ${input.category}, gender = ${input.gender},
      price_amount = ${input.priceAmount}, compare_at_amount = ${input.compareAtAmount},
      colors = ${jsonb(buildColors(input))}, images = ${jsonb(buildImages(input))},
      collection_slugs = ${jsonb(input.collectionSlugs)},
      is_new = ${input.isNew}, featured = ${input.featured},
      giftcard_denominations = ${input.giftcardDenominations ? jsonb(input.giftcardDenominations) : null},
      updated_at = now()
    where id = ${id}
  `;

  const existing = await sql<{ id: string; size: string }[]>`
    select id, size from product_variants where product_id = ${id}
  `;
  const keepSizes = new Set(input.variants.map((v) => v.size));
  for (const row of existing) {
    if (!keepSizes.has(row.size)) {
      await sql`delete from product_variants where id = ${row.id}`;
    }
  }
  for (const v of input.variants) {
    await sql`
      insert into product_variants (id, product_id, size, stock)
      values (${`${id}-${v.size}`}, ${id}, ${v.size}, ${v.stock})
      on conflict (product_id, size) do update set stock = excluded.stock
    `;
  }
}

export async function setProductArchived(id: string, archived: boolean): Promise<void> {
  await sql`update products set archived = ${archived}, updated_at = now() where id = ${id}`;
}

export async function markAllVariantsSoldOut(id: string): Promise<void> {
  await sql`update product_variants set stock = 0 where product_id = ${id}`;
}

export async function deleteProductPermanently(id: string): Promise<void> {
  await sql`delete from products where id = ${id}`; // cascades variants + reviews
}
