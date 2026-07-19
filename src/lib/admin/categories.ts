import "server-only";
import { sql } from "@/lib/db/client";
import {
  dbReadCategories,
  ensureCategoriesSeeded,
  GIFT_CARD_CATEGORY,
} from "@/lib/catalog/categories";

export interface AdminCategoryRow {
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  sortOrder: number;
  archived: boolean;
  productCount: number;
}

/** Categories with a live product count, for the admin list. */
export async function listAdminCategories(): Promise<AdminCategoryRow[]> {
  const [records, counts] = await Promise.all([
    dbReadCategories(true),
    sql<{ category: string; n: string }[]>`
      select category, count(*)::text as n from products group by category
    `,
  ]);
  const countBySlug = new Map(counts.map((c) => [c.category, Number(c.n)]));
  return records.map((r) => ({
    slug: r.slug,
    titleEn: r.title.en,
    titleAr: r.title.ar,
    titleKu: r.title.ku,
    sortOrder: r.sortOrder,
    archived: r.archived,
    productCount: countBySlug.get(r.slug) ?? 0,
  }));
}

export async function getAdminCategory(slug: string): Promise<AdminCategoryRow | undefined> {
  const all = await listAdminCategories();
  return all.find((c) => c.slug === slug);
}

export async function categorySlugExists(slug: string): Promise<boolean> {
  await ensureCategoriesSeeded();
  const rows = await sql<{ slug: string }[]>`select slug from categories where slug = ${slug} limit 1`;
  return rows.length > 0;
}

export interface CategoryInput {
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  sortOrder: number;
}

export async function createCategory(input: CategoryInput): Promise<void> {
  await ensureCategoriesSeeded();
  await sql`
    insert into categories (slug, title_en, title_ar, title_ku, sort_order)
    values (${input.slug}, ${input.titleEn}, ${input.titleAr}, ${input.titleKu}, ${input.sortOrder})
  `;
}

export async function updateCategory(slug: string, input: CategoryInput): Promise<void> {
  await ensureCategoriesSeeded();
  await sql`
    update categories set
      title_en = ${input.titleEn}, title_ar = ${input.titleAr}, title_ku = ${input.titleKu},
      sort_order = ${input.sortOrder}
    where slug = ${slug}
  `;
}

export async function setCategoryArchived(slug: string, archived: boolean): Promise<void> {
  await ensureCategoriesSeeded();
  await sql`update categories set archived = ${archived} where slug = ${slug}`;
}

/** Reserved slug that drives gift-card product behaviour — never deletable. */
export function isReservedCategory(slug: string): boolean {
  return slug === GIFT_CARD_CATEGORY;
}

export async function deleteCategory(slug: string): Promise<{ error?: string }> {
  if (isReservedCategory(slug)) {
    return { error: "The Gift Cards category is required and can't be deleted." };
  }
  const inUse = await sql<{ n: string }[]>`
    select count(*)::text as n from products where category = ${slug}
  `;
  if (Number(inUse[0]?.n ?? 0) > 0) {
    return {
      error:
        "Some products still use this category. Move them to another category first, or archive this one instead.",
    };
  }
  await sql`delete from categories where slug = ${slug}`;
  return {};
}
