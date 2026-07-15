/**
 * One-time bootstrap: creates the schema and seeds it with the original
 * catalog (products, collections, blog posts) so the site has real
 * content the moment /admin is live. Safe to re-run — every insert uses
 * ON CONFLICT DO NOTHING, so it never overwrites edits made from the
 * admin afterwards.
 *
 * Usage:
 *   npm run db:migrate                # local dev DB (npm run db:dev)
 *   vercel env pull .env.local && npm run db:migrate   # production DB
 */
import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { seedProducts, seedCollections, seedPosts, type SeedImage } from "./seed-data";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — assume DATABASE_URL is already in the environment
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and point it " +
      "at a Postgres instance (run `npm run db:dev` for a local one), or " +
      "`vercel env pull .env.local` to migrate the real production database.",
  );
  process.exit(1);
}

// A standalone client, not the app's src/lib/db/client.ts — that module
// is guarded by the `server-only` package, which throws when imported
// from a plain script outside Next's server runtime (this one).
const ROOT = path.resolve(import.meta.dirname, "..");
const sql = postgres(DATABASE_URL, {
  ssl: /localhost|127\.0\.0\.1/.test(DATABASE_URL) ? false : "require",
});
function jsonb(value: unknown) {
  return sql.json(value as postgres.JSONValue);
}

/* ------------------------------------------------------------------ */
/* Image resolution: copy the real files into public/, or upload to    */
/* Vercel Blob if a token is configured, so every image key becomes a  */
/* stable URL the DB can store.                                        */
/* ------------------------------------------------------------------ */

const imageUrlCache = new Map<string, string>();

async function resolveImageUrl(key: string): Promise<string> {
  const cached = imageUrlCache.get(key);
  if (cached) return cached;

  const basename = path.basename(key);
  const sourcePath = path.join(ROOT, "src/images", key);

  let url: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const buffer = readFileSync(sourcePath);
    const blob = await put(`seed/${basename}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    url = blob.url;
  } else {
    const destDir = path.join(ROOT, "public/seed-images");
    mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, basename);
    if (!existsSync(destPath)) copyFileSync(sourcePath, destPath);
    url = `/seed-images/${basename}`;
  }

  imageUrlCache.set(key, url);
  return url;
}

async function resolveImage(img: SeedImage) {
  return { url: await resolveImageUrl(img.key), alt: img.alt };
}

/* ------------------------------------------------------------------ */

async function main() {
  console.log(`[migrate] connecting to ${process.env.DATABASE_URL!.replace(/:[^:@]*@/, ":***@")}`);

  console.log("[migrate] applying schema.sql");
  const schema = readFileSync(path.join(ROOT, "src/lib/db/schema.sql"), "utf8");
  await sql.unsafe(schema);

  let productsInserted = 0;
  for (const p of seedProducts) {
    const images = await Promise.all(p.images.map(resolveImage));
    const id = `p_${p.slug.replace(/-/g, "_")}`;

    const inserted = await sql`
      insert into products (
        id, slug, title_en, title_ar, title_ku,
        description_en, description_ar, description_ku,
        story_en, story_ar, story_ku,
        details, category, gender, price_amount, compare_at_amount,
        colors, images, collection_slugs, is_new, featured, release_date,
        giftcard_denominations
      ) values (
        ${id}, ${p.slug}, ${p.title.en}, ${p.title.ar}, ${p.title.ku},
        ${p.description.en}, ${p.description.ar}, ${p.description.ku},
        ${p.story?.en ?? null}, ${p.story?.ar ?? null}, ${p.story?.ku ?? null},
        ${jsonb(p.details)}, ${p.category}, ${p.gender}, ${p.priceAmount},
        ${p.compareAtAmount ?? null},
        ${jsonb(p.colors)}, ${jsonb(images)}, ${jsonb(p.collectionSlugs)},
        ${p.isNew ?? false}, ${p.featured ?? false}, ${p.releaseDate},
        ${p.giftCardDenominations ? jsonb(p.giftCardDenominations) : null}
      )
      on conflict (slug) do nothing
      returning id
    `;
    if (inserted.length === 0) continue; // already migrated, skip variants/reviews too
    productsInserted++;

    for (const v of p.variants) {
      await sql`
        insert into product_variants (id, product_id, size, stock)
        values (${`${id}-${v.size}`}, ${id}, ${v.size}, ${v.stock})
        on conflict (product_id, size) do nothing
      `;
    }
    for (const [i, r] of p.reviews.entries()) {
      await sql`
        insert into reviews (id, product_slug, author, rating, body, approved, created_at)
        values (${`${id}-rev-${i}`}, ${p.slug}, ${r.author}, ${r.rating}, ${r.text}, true, ${r.date})
        on conflict (id) do nothing
      `;
    }
  }
  console.log(`[migrate] products: ${productsInserted} inserted, ${seedProducts.length - productsInserted} already present`);

  let collectionsInserted = 0;
  for (const c of seedCollections) {
    const heroImage = await resolveImage(c.heroImage);
    const inserted = await sql`
      insert into collections (
        slug, title_en, title_ar, title_ku, tagline_en, tagline_ar, tagline_ku,
        description_en, description_ar, description_ku, hero_image, theme,
        archived, sort_order
      ) values (
        ${c.slug}, ${c.title.en}, ${c.title.ar}, ${c.title.ku},
        ${c.tagline.en}, ${c.tagline.ar}, ${c.tagline.ku},
        ${c.description.en}, ${c.description.ar}, ${c.description.ku},
        ${jsonb(heroImage)}, ${c.theme}, ${c.archived ?? false}, ${c.order}
      )
      on conflict (slug) do nothing
      returning slug
    `;
    if (inserted.length > 0) collectionsInserted++;
  }
  console.log(`[migrate] collections: ${collectionsInserted} inserted, ${seedCollections.length - collectionsInserted} already present`);

  let postsInserted = 0;
  for (const p of seedPosts) {
    const cover = await resolveImage(p.cover);
    const body = await Promise.all(
      p.body.map(async (block) =>
        block.type === "image" ? { ...block, image: await resolveImage(block.image) } : block,
      ),
    );
    const inserted = await sql`
      insert into posts (
        slug, title_en, title_ar, title_ku, excerpt_en, excerpt_ar, excerpt_ku,
        cover, post_date, reading_minutes, author, body, related_product_slugs
      ) values (
        ${p.slug}, ${p.title.en}, ${p.title.ar}, ${p.title.ku},
        ${p.excerpt.en}, ${p.excerpt.ar}, ${p.excerpt.ku},
        ${jsonb(cover)}, ${p.date}, ${p.readingMinutes}, ${p.author},
        ${jsonb(body)}, ${jsonb(p.relatedProductSlugs)}
      )
      on conflict (slug) do nothing
      returning slug
    `;
    if (inserted.length > 0) postsInserted++;
  }
  console.log(`[migrate] posts: ${postsInserted} inserted, ${seedPosts.length - postsInserted} already present`);

  console.log("[migrate] done");
  await sql.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
