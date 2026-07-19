/**
 * Imports the Capitres catalog (all products + collections, with photos,
 * prices, sizes, trilingual copy and reviews) into the database named by
 * DATABASE_URL.
 *
 * SAFE + ADDITIVE: every insert uses ON CONFLICT DO NOTHING, so it only
 * fills in what's missing and never overwrites anything you've already
 * edited in /admin. Re-running it is harmless.
 *
 * Run it against your PRODUCTION database (URL from Vercel → Storage →
 * your Postgres → the ".env.local" tab):
 *
 *   cd "<the capitres project folder>"
 *   DATABASE_URL="postgres://...paste here..." npx -y tsx scripts/import-catalog.mts
 */
import postgres from "postgres";
import { seedProducts, seedCollections, type SeedImage } from "./seed-data";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "\n❌ DATABASE_URL is not set.\n\n" +
      "Copy your production database URL from Vercel → Storage → your Postgres →\n" +
      'the ".env.local" tab, then run:\n\n' +
      '  DATABASE_URL="postgres://..." npx -y tsx scripts/import-catalog.mts\n',
  );
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: /localhost|127\.0\.0\.1/.test(DATABASE_URL) ? false : "require",
});

const jsonb = (v: unknown) => sql.json(v as postgres.JSONValue);
// Photos already live in the deployed site's /seed-images folder.
const toImage = (img: SeedImage) => ({
  url: `/seed-images/${img.key.split("/").pop()}`,
  alt: img.alt,
});
const productId = (slug: string) => `p_${slug.replace(/-/g, "_")}`;

async function main() {
  console.log(`Connecting to ${DATABASE_URL!.replace(/:[^:@]*@/, ":***@")}\n`);

  let productsAdded = 0;
  for (const p of seedProducts) {
    const id = productId(p.slug);
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
        ${jsonb(p.colors)}, ${jsonb(p.images.map(toImage))}, ${jsonb(p.collectionSlugs)},
        ${p.isNew ?? false}, ${p.featured ?? false}, ${p.releaseDate},
        ${p.giftCardDenominations ? jsonb(p.giftCardDenominations) : null}
      )
      on conflict (slug) do nothing
      returning id
    `;
    if (inserted.length === 0) {
      console.log(`=  ${p.slug} — already in your store, left untouched`);
      continue;
    }
    productsAdded++;
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
    console.log(`+  ${p.slug} — added`);
  }

  let collectionsAdded = 0;
  for (const c of seedCollections) {
    const inserted = await sql`
      insert into collections (
        slug, title_en, title_ar, title_ku, tagline_en, tagline_ar, tagline_ku,
        description_en, description_ar, description_ku, hero_image, theme,
        archived, sort_order
      ) values (
        ${c.slug}, ${c.title.en}, ${c.title.ar}, ${c.title.ku},
        ${c.tagline.en}, ${c.tagline.ar}, ${c.tagline.ku},
        ${c.description.en}, ${c.description.ar}, ${c.description.ku},
        ${jsonb(toImage(c.heroImage))}, ${c.theme}, ${c.archived ?? false}, ${c.order}
      )
      on conflict (slug) do nothing
      returning slug
    `;
    if (inserted.length > 0) {
      collectionsAdded++;
      console.log(`+  collection "${c.slug}" — added`);
    } else {
      console.log(`=  collection "${c.slug}" — already there, left untouched`);
    }
  }

  console.log(
    `\n✅ Done. Added ${productsAdded} product(s) and ${collectionsAdded} collection(s).`,
  );
  console.log("Anything already in your store was left exactly as it was.\n");
  await sql.end();
}

main().catch((err: unknown) => {
  console.error("\n❌ Import failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
