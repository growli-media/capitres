import "server-only";
import { sql } from "@/lib/db/client";
import type { LocalizedString } from "@/lib/content";
import type { CategoryOption } from "./types";

/**
 * The original five categories. Also the seed for the DB-backed
 * `categories` table, and the fallback the storefront uses when no
 * database is configured.
 */
export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { slug: "tees", title: { en: "Tees", ar: "تيشيرتات", ku: "تیشێرت" }, sortOrder: 1 },
  { slug: "jerseys", title: { en: "Jerseys", ar: "قمصان رياضية", ku: "کراسی وەرزشی" }, sortOrder: 2 },
  { slug: "outerwear", title: { en: "Outerwear", ar: "جاكيتات", ku: "چاکەت" }, sortOrder: 3 },
  { slug: "accessories", title: { en: "Accessories", ar: "إكسسوارات", ku: "ئێکسسوارات" }, sortOrder: 4 },
  { slug: "gift-cards", title: { en: "Gift Cards", ar: "بطاقات هدايا", ku: "کارتی دیاری" }, sortOrder: 5 },
];

/** "gift-cards" is special everywhere (denominations instead of sizes,
 * links to /gift-cards) — surfaced here so nothing hardcodes the string. */
export const GIFT_CARD_CATEGORY = "gift-cards";

let ensured: Promise<void> | null = null;

/**
 * Creates the `categories` table if it's missing and seeds the original
 * five, so a production database that predates this feature starts
 * working with no manual migration. Memoized: runs at most once per warm
 * server instance.
 */
export function ensureCategoriesSeeded(): Promise<void> {
  if (!ensured) {
    ensured = doEnsure().catch((err) => {
      // Reset so a transient failure can be retried on the next call.
      ensured = null;
      throw err;
    });
  }
  return ensured;
}

async function doEnsure(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      slug        text PRIMARY KEY,
      title_en    text NOT NULL,
      title_ar    text NOT NULL,
      title_ku    text NOT NULL,
      sort_order  integer NOT NULL DEFAULT 0,
      archived    boolean NOT NULL DEFAULT false,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `;
  for (const c of DEFAULT_CATEGORIES) {
    await sql`
      insert into categories (slug, title_en, title_ar, title_ku, sort_order)
      values (${c.slug}, ${c.title.en}, ${c.title.ar}, ${c.title.ku}, ${c.sortOrder})
      on conflict (slug) do nothing
    `;
  }
}

interface CategoryRow {
  slug: string;
  title_en: string;
  title_ar: string;
  title_ku: string;
  sort_order: number;
  archived: boolean;
}

export interface CategoryRecord extends CategoryOption {
  archived: boolean;
}

export async function dbReadCategories(includeArchived = false): Promise<CategoryRecord[]> {
  await ensureCategoriesSeeded();
  const rows = includeArchived
    ? await sql<CategoryRow[]>`select * from categories order by sort_order asc, slug asc`
    : await sql<CategoryRow[]>`select * from categories where archived = false order by sort_order asc, slug asc`;
  return rows.map((r) => ({
    slug: r.slug,
    title: loc(r.title_en, r.title_ar, r.title_ku),
    sortOrder: r.sort_order,
    archived: r.archived,
  }));
}

function loc(en: string, ar: string, ku: string): LocalizedString {
  return { en, ar, ku };
}
