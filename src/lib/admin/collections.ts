import "server-only";
import { sql, jsonb } from "@/lib/db/client";

export interface AdminCollectionRow {
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  taglineEn: string;
  taglineAr: string;
  taglineKu: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionKu: string;
  heroImageUrl: string;
  heroImageAltEn: string;
  heroImageAltAr: string;
  heroImageAltKu: string;
  theme: "light" | "dark";
  archived: boolean;
  sortOrder: number;
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
  hero_image: { url: string; alt: { en: string; ar: string; ku: string } };
  theme: "light" | "dark";
  archived: boolean;
  sort_order: number;
}

function toRow(r: CollectionRow): AdminCollectionRow {
  return {
    slug: r.slug,
    titleEn: r.title_en,
    titleAr: r.title_ar,
    titleKu: r.title_ku,
    taglineEn: r.tagline_en,
    taglineAr: r.tagline_ar,
    taglineKu: r.tagline_ku,
    descriptionEn: r.description_en,
    descriptionAr: r.description_ar,
    descriptionKu: r.description_ku,
    heroImageUrl: r.hero_image?.url ?? "",
    heroImageAltEn: r.hero_image?.alt?.en ?? "",
    heroImageAltAr: r.hero_image?.alt?.ar ?? "",
    heroImageAltKu: r.hero_image?.alt?.ku ?? "",
    theme: r.theme,
    archived: r.archived,
    sortOrder: r.sort_order,
  };
}

export async function listAdminCollections(): Promise<AdminCollectionRow[]> {
  const rows = await sql<CollectionRow[]>`
    select * from collections order by sort_order asc, slug asc
  `;
  return rows.map(toRow);
}

export async function getAdminCollection(slug: string): Promise<AdminCollectionRow | undefined> {
  const rows = await sql<CollectionRow[]>`select * from collections where slug = ${slug} limit 1`;
  return rows[0] ? toRow(rows[0]) : undefined;
}

export async function collectionSlugExists(slug: string): Promise<boolean> {
  const rows = await sql<{ slug: string }[]>`select slug from collections where slug = ${slug} limit 1`;
  return rows.length > 0;
}

export interface CollectionInput {
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  taglineEn: string;
  taglineAr: string;
  taglineKu: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionKu: string;
  heroImageUrl: string;
  heroImageAltEn: string;
  heroImageAltAr: string;
  heroImageAltKu: string;
  theme: "light" | "dark";
  sortOrder: number;
}

function heroImageJson(input: CollectionInput) {
  return {
    url: input.heroImageUrl,
    alt: { en: input.heroImageAltEn, ar: input.heroImageAltAr, ku: input.heroImageAltKu },
  };
}

export async function createCollection(input: CollectionInput): Promise<void> {
  await sql`
    insert into collections (
      slug, title_en, title_ar, title_ku,
      tagline_en, tagline_ar, tagline_ku,
      description_en, description_ar, description_ku,
      hero_image, theme, sort_order
    ) values (
      ${input.slug}, ${input.titleEn}, ${input.titleAr}, ${input.titleKu},
      ${input.taglineEn}, ${input.taglineAr}, ${input.taglineKu},
      ${input.descriptionEn}, ${input.descriptionAr}, ${input.descriptionKu},
      ${jsonb(heroImageJson(input))}, ${input.theme}, ${input.sortOrder}
    )
  `;
}

export async function updateCollection(slug: string, input: CollectionInput): Promise<void> {
  await sql`
    update collections set
      title_en = ${input.titleEn}, title_ar = ${input.titleAr}, title_ku = ${input.titleKu},
      tagline_en = ${input.taglineEn}, tagline_ar = ${input.taglineAr}, tagline_ku = ${input.taglineKu},
      description_en = ${input.descriptionEn}, description_ar = ${input.descriptionAr},
      description_ku = ${input.descriptionKu},
      hero_image = ${jsonb(heroImageJson(input))},
      theme = ${input.theme},
      sort_order = ${input.sortOrder}
    where slug = ${slug}
  `;
}

export async function setCollectionArchived(slug: string, archived: boolean): Promise<void> {
  await sql`update collections set archived = ${archived} where slug = ${slug}`;
}

export async function deleteCollectionPermanently(slug: string): Promise<void> {
  // Products referencing this slug in their collection_slugs array just
  // stop matching anything — no FK to cascade, nothing else to clean up.
  await sql`delete from collections where slug = ${slug}`;
}
