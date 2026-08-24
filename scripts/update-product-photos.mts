/**
 * Updates the photos, description and colours on products that already
 * exist in the database named by DATABASE_URL, using scripts/seed-data.ts
 * as the source of truth — these three fields tend to change together
 * (new photography usually means the copy and colour name need to match
 * it). Price, story, stock, and everything else is left untouched.
 *
 * This is the companion to import-catalog.mts: that script only ever
 * INSERTs (safe, but skips anything that already exists — so it can't push
 * an update to a product you already imported). This one only ever UPDATEs,
 * matched by slug, and only for slugs it finds in seed-data.ts — it does
 * nothing to products that aren't listed there.
 *
 * Run it against your PRODUCTION database (URL from Vercel → Storage →
 * your Postgres → the ".env.local" tab):
 *
 *   cd "<the capitres project folder>"
 *   DATABASE_URL="postgres://...paste here..." npx -y tsx scripts/update-product-photos.mts
 */
import postgres from "postgres";
import { seedProducts, type SeedImage } from "./seed-data";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "\n❌ DATABASE_URL is not set.\n\n" +
      "Copy your production database URL from Vercel → Storage → your Postgres →\n" +
      'the ".env.local" tab, then run:\n\n' +
      '  DATABASE_URL="postgres://..." npx -y tsx scripts/update-product-photos.mts\n',
  );
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: /localhost|127\.0\.0\.1/.test(DATABASE_URL) ? false : "require",
});

const jsonb = (v: unknown) => sql.json(v as postgres.JSONValue);
const toImage = (img: SeedImage) => ({
  url: `/seed-images/${img.key.split("/").pop()}`,
  alt: img.alt,
});

async function main() {
  console.log(`Connecting to ${DATABASE_URL!.replace(/:[^:@]*@/, ":***@")}\n`);

  let updated = 0;
  for (const p of seedProducts) {
    const images = p.images.map(toImage);
    const result = await sql`
      update products
      set
        images = ${jsonb(images)},
        description_en = ${p.description.en},
        description_ar = ${p.description.ar},
        description_ku = ${p.description.ku},
        colors = ${jsonb(p.colors)}
      where slug = ${p.slug}
      returning slug
    `;
    if (result.length > 0) {
      updated++;
      console.log(`+  ${p.slug} — now ${images.length} photo(s), description + colours synced`);
    } else {
      console.log(`.  ${p.slug} — not in your store yet, skipped`);
    }
  }

  console.log(`\n✅ Done. Updated ${updated} product(s).`);
  await sql.end();
}

main().catch((err: unknown) => {
  console.error("\n❌ Update failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
