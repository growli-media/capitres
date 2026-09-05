import "server-only";
import { sql, jsonb } from "@/lib/db/client";

export interface AdminCollectionImage {
  url: string;
  altEn: string;
  altAr: string;
  altKu: string;
}

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
  /** Legacy single-image fields — still what the admin listing thumbnail
   * uses. Kept in sync as heroImages[0] on every save (see heroImagesJson
   * below) so nothing reading these needs to change. */
  heroImageUrl: string;
  heroImageAltEn: string;
  heroImageAltAr: string;
  heroImageAltKu: string;
  /** Story banner — see CollectionForm.tsx's "Photos" section. */
  heroImages: AdminCollectionImage[];
  videoUrl: string | null;
  /** Physical left/center/right per locale — see schema.sql for why
   * these default to each language's natural direction, not "left". */
  textAlignEn: string;
  textAlignAr: string;
  textAlignKu: string;
  publishedDate: string | null;
  publishedWhere: string | null;
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
  hero_images: { url: string; alt: { en: string; ar: string; ku: string } }[] | null;
  video_url: string | null;
  text_align_en: string;
  text_align_ar: string;
  text_align_ku: string;
  // postgres.js decodes a `date` column as a JS Date, not a string —
  // same gotcha documented in src/lib/catalog/providers/postgres.ts's
  // dateOnly() helper, reused below for the same reason.
  published_date: string | Date | null;
  published_where: string | null;
  theme: "light" | "dark";
  archived: boolean;
  sort_order: number;
}

/** postgres.js returns `date` columns as JS Date objects (parsed in local
 * time) — normalize to the plain "YYYY-MM-DD" string an <input type="date">
 * expects. Same helper as src/lib/catalog/providers/postgres.ts's
 * dateOnly(), duplicated rather than cross-imported (that one is a
 * private helper in the public catalog layer, not this admin layer). */
function dateOnly(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
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
    heroImages: (r.hero_images ?? []).map((img) => ({
      url: img.url,
      altEn: img.alt?.en ?? "",
      altAr: img.alt?.ar ?? "",
      altKu: img.alt?.ku ?? "",
    })),
    videoUrl: r.video_url,
    textAlignEn: r.text_align_en,
    textAlignAr: r.text_align_ar,
    textAlignKu: r.text_align_ku,
    publishedDate: r.published_date ? dateOnly(r.published_date) : null,
    publishedWhere: r.published_where,
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
  heroImages: AdminCollectionImage[];
  videoUrl: string | null;
  textAlignEn: string;
  textAlignAr: string;
  textAlignKu: string;
  publishedDate: string | null;
  publishedWhere: string | null;
  theme: "light" | "dark";
  sortOrder: number;
}

function heroImagesJson(input: CollectionInput) {
  return input.heroImages.map((img) => ({
    url: img.url,
    alt: { en: img.altEn, ar: img.altAr, ku: img.altKu },
  }));
}

/** hero_image (singular) is NOT NULL — still what the admin thumbnail,
 * storefront nav, and homepage panels read. A collection saved with no
 * photos (video-only, see actions.ts) still needs something valid there,
 * so it falls back to this on-brand placeholder rather than failing the
 * insert. heroImages (plural) stays genuinely empty in that case — that's
 * the signal CollectionHero.tsx uses to skip the photo layer entirely on
 * the collection's own page and show only the video. */
const VIDEO_ONLY_PLACEHOLDER_IMAGE = {
  url: "/brand/video-only-placeholder.jpg",
  alt: { en: "", ar: "", ku: "" },
};

export async function createCollection(input: CollectionInput): Promise<void> {
  const images = heroImagesJson(input);
  const heroImage = images[0] ?? VIDEO_ONLY_PLACEHOLDER_IMAGE;
  await sql`
    insert into collections (
      slug, title_en, title_ar, title_ku,
      tagline_en, tagline_ar, tagline_ku,
      description_en, description_ar, description_ku,
      hero_image, hero_images, video_url,
      text_align_en, text_align_ar, text_align_ku,
      published_date, published_where,
      theme, sort_order
    ) values (
      ${input.slug}, ${input.titleEn}, ${input.titleAr}, ${input.titleKu},
      ${input.taglineEn}, ${input.taglineAr}, ${input.taglineKu},
      ${input.descriptionEn}, ${input.descriptionAr}, ${input.descriptionKu},
      ${jsonb(heroImage)}, ${jsonb(images)}, ${input.videoUrl},
      ${input.textAlignEn}, ${input.textAlignAr}, ${input.textAlignKu},
      ${input.publishedDate}, ${input.publishedWhere}, ${input.theme}, ${input.sortOrder}
    )
  `;
}

export async function updateCollection(slug: string, input: CollectionInput): Promise<void> {
  const images = heroImagesJson(input);
  const heroImage = images[0] ?? VIDEO_ONLY_PLACEHOLDER_IMAGE;
  await sql`
    update collections set
      title_en = ${input.titleEn}, title_ar = ${input.titleAr}, title_ku = ${input.titleKu},
      tagline_en = ${input.taglineEn}, tagline_ar = ${input.taglineAr}, tagline_ku = ${input.taglineKu},
      description_en = ${input.descriptionEn}, description_ar = ${input.descriptionAr},
      description_ku = ${input.descriptionKu},
      hero_image = ${jsonb(heroImage)},
      hero_images = ${jsonb(images)},
      video_url = ${input.videoUrl},
      text_align_en = ${input.textAlignEn},
      text_align_ar = ${input.textAlignAr},
      text_align_ku = ${input.textAlignKu},
      published_date = ${input.publishedDate},
      published_where = ${input.publishedWhere},
      theme = ${input.theme},
      sort_order = ${input.sortOrder}
    where slug = ${slug}
  `;
}

export async function setCollectionArchived(slug: string, archived: boolean): Promise<void> {
  await sql`update collections set archived = ${archived} where slug = ${slug}`;
}

/** Rewrites sort_order to match `slugs`' array position (0, 1, 2, ...) —
 * the admin's own drag-reordered order on the list page. One statement
 * per row inside a transaction; the list is small enough (a handful to a
 * few dozen collections) that this is simpler than a bulk unnest/CASE
 * query and still atomic. */
export async function reorderCollections(slugs: string[]): Promise<void> {
  await sql.begin(async (tx) => {
    for (let i = 0; i < slugs.length; i++) {
      await tx`update collections set sort_order = ${i} where slug = ${slugs[i]}`;
    }
  });
}

export async function deleteCollectionPermanently(slug: string): Promise<void> {
  // Products referencing this slug in their collection_slugs array just
  // stop matching anything — no FK to cascade, nothing else to clean up.
  await sql`delete from collections where slug = ${slug}`;
}
