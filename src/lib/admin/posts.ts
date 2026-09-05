import "server-only";
import { sql, jsonb } from "@/lib/db/client";

export interface AdminPostImage {
  url: string;
  altEn: string;
  altAr: string;
  altKu: string;
}

type Loc = { en: string; ar: string; ku: string };

/** Body blocks as actually stored in the `posts.body` jsonb column — image
 * and video-poster carry a plain `{url, alt}`, same shape as `cover`, not
 * the `ProductImage` (`{src, alt}`) shape the public catalog type uses.
 * The public postgres provider's toPost() converts url -> src at read time
 * (via toImage()); the admin side works in this raw shape throughout,
 * matching how AdminPostImage/AdminCollectionImage already do for cover
 * and collection photos. */
export type AdminPostBlock =
  | { type: "p"; text: Loc }
  | { type: "h2"; text: Loc }
  | { type: "quote"; text: Loc; attribution?: Loc }
  | { type: "image"; image: { url: string; alt: Loc } }
  | { type: "video"; url: string; poster?: { url: string; alt: Loc } }
  | { type: "link"; url: string; label: Loc };

export interface AdminPostRow {
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  excerptEn: string;
  excerptAr: string;
  excerptKu: string;
  cover: AdminPostImage;
  postDate: string;
  readingMinutes: number;
  author: string;
  body: AdminPostBlock[];
  relatedProductSlugs: string[];
  published: boolean;
}

interface PostRow {
  slug: string;
  title_en: string;
  title_ar: string;
  title_ku: string;
  excerpt_en: string;
  excerpt_ar: string;
  excerpt_ku: string;
  cover: { url: string; alt: { en: string; ar: string; ku: string } };
  // postgres.js decodes a `date` column as a JS Date, not a string — same
  // gotcha documented in src/lib/catalog/providers/postgres.ts's
  // dateOnly() helper, reused below for the same reason.
  post_date: string | Date;
  reading_minutes: number;
  author: string;
  body: AdminPostBlock[];
  related_product_slugs: string[];
  published: boolean;
}

/** Duplicated per-admin-file rather than shared, matching the existing
 * convention in src/lib/admin/collections.ts (see its own copy's comment). */
function dateOnly(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function toRow(r: PostRow): AdminPostRow {
  return {
    slug: r.slug,
    titleEn: r.title_en,
    titleAr: r.title_ar,
    titleKu: r.title_ku,
    excerptEn: r.excerpt_en,
    excerptAr: r.excerpt_ar,
    excerptKu: r.excerpt_ku,
    cover: {
      url: r.cover?.url ?? "",
      altEn: r.cover?.alt?.en ?? "",
      altAr: r.cover?.alt?.ar ?? "",
      altKu: r.cover?.alt?.ku ?? "",
    },
    postDate: dateOnly(r.post_date),
    readingMinutes: r.reading_minutes,
    author: r.author,
    body: r.body ?? [],
    relatedProductSlugs: r.related_product_slugs ?? [],
    published: r.published,
  };
}

export async function listAdminPosts(): Promise<AdminPostRow[]> {
  const rows = await sql<PostRow[]>`
    select * from posts order by post_date desc
  `;
  return rows.map(toRow);
}

export async function getAdminPost(slug: string): Promise<AdminPostRow | undefined> {
  const rows = await sql<PostRow[]>`select * from posts where slug = ${slug} limit 1`;
  return rows[0] ? toRow(rows[0]) : undefined;
}

export async function postSlugExists(slug: string): Promise<boolean> {
  const rows = await sql<{ slug: string }[]>`select slug from posts where slug = ${slug} limit 1`;
  return rows.length > 0;
}

export interface PostInput {
  slug: string;
  titleEn: string;
  titleAr: string;
  titleKu: string;
  excerptEn: string;
  excerptAr: string;
  excerptKu: string;
  cover: AdminPostImage;
  postDate: string;
  readingMinutes: number;
  author: string;
  body: AdminPostBlock[];
  relatedProductSlugs: string[];
  published: boolean;
}

function coverJson(cover: AdminPostImage) {
  return { url: cover.url, alt: { en: cover.altEn, ar: cover.altAr, ku: cover.altKu } };
}

export async function createPost(input: PostInput): Promise<void> {
  await sql`
    insert into posts (
      slug, title_en, title_ar, title_ku,
      excerpt_en, excerpt_ar, excerpt_ku,
      cover, post_date, reading_minutes, author,
      body, related_product_slugs, published
    ) values (
      ${input.slug}, ${input.titleEn}, ${input.titleAr}, ${input.titleKu},
      ${input.excerptEn}, ${input.excerptAr}, ${input.excerptKu},
      ${jsonb(coverJson(input.cover))}, ${input.postDate}, ${input.readingMinutes}, ${input.author},
      ${jsonb(input.body)}, ${jsonb(input.relatedProductSlugs)}, ${input.published}
    )
  `;
}

export async function updatePost(slug: string, input: PostInput): Promise<void> {
  await sql`
    update posts set
      title_en = ${input.titleEn}, title_ar = ${input.titleAr}, title_ku = ${input.titleKu},
      excerpt_en = ${input.excerptEn}, excerpt_ar = ${input.excerptAr}, excerpt_ku = ${input.excerptKu},
      cover = ${jsonb(coverJson(input.cover))},
      post_date = ${input.postDate},
      reading_minutes = ${input.readingMinutes},
      author = ${input.author},
      body = ${jsonb(input.body)},
      related_product_slugs = ${jsonb(input.relatedProductSlugs)},
      published = ${input.published}
    where slug = ${slug}
  `;
}

export async function setPostPublished(slug: string, published: boolean): Promise<void> {
  await sql`update posts set published = ${published} where slug = ${slug}`;
}

export async function deletePostPermanently(slug: string): Promise<void> {
  await sql`delete from posts where slug = ${slug}`;
}
