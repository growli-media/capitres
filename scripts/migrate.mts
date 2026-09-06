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
import { formatIQD, formatCurrency, localizeDigits } from "../src/lib/money";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_RATE_IQ,
  SHIPPING_RATE_INTL_USD,
} from "../src/lib/commerce/config";

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
const isLocal = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
const sql = postgres(DATABASE_URL, {
  ssl: isLocal ? false : "require",
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

/**
 * Seed content for the 4 admin-editable legal pages — flattened from the
 * exact copy that used to live in messages/{en,ar,ku}.json's "policies"
 * namespace (now owned by the admin going forward), using the same
 * "## Heading" line convention the public renderer understands. Only
 * runs once per slug (ON CONFLICT DO NOTHING below), so editing these
 * from the admin is never overwritten by a later migrate.
 */
type Locale = "en" | "ar" | "ku";

function privacyBody(locale: Locale): string {
  const copy: Record<Locale, [string, string]> = {
    en: [
      "We collect only what an order needs: your name, contact details and delivery address. Payment details go directly to Wayl and never touch our servers.",
      "We never sell your data. Newsletter emails go out only if you opted in, and every one carries an unsubscribe link.",
    ],
    ar: [
      "نجمع فقط ما يحتاجه الطلب: اسمك وبيانات التواصل وعنوان التوصيل. بيانات الدفع تذهب مباشرة إلى ويل ولا تمر بخوادمنا.",
      "لا نبيع بياناتك أبداً. رسائل القائمة البريدية تصلك فقط إن اشتركت، وكل رسالة تحمل رابط إلغاء الاشتراك.",
    ],
    ku: [
      "تەنیا ئەوە کۆدەکەینەوە کە داواکارییەکە پێویستی پێیەتی: ناوت، زانیاری پەیوەندی و ناونیشانی گەیاندن. زانیاری پارەدان ڕاستەوخۆ دەچێتە لای وەیل و بە سێرڤەرەکانماندا تێناپەڕێت.",
      "هەرگیز زانیاریت نافرۆشین. ئیمەیڵی خەبەرنامە تەنیا ئەگەر بەشداربوویت بۆت دێت، و هەموو نامەیەک لینکی وازهێنانی تێدایە.",
    ],
  };
  return copy[locale].join("\n\n");
}

function termsBody(locale: Locale): string {
  const copy: Record<Locale, [string, string]> = {
    en: [
      "Prices are listed in Iraqi Dinar (IQD). Orders are confirmed once payment completes through Wayl and you receive an order reference.",
      "Heritage releases are limited editions; quantities per customer may be capped during drops. All imagery and designs are the property of Capitres.",
    ],
    ar: [
      "الأسعار بالدينار العراقي. يُؤكَّد الطلب بعد اكتمال الدفع عبر ويل واستلامك رقم الطلب.",
      "إصدارات التراث محدودة الكمية؛ وقد تُحدَّد الكمية لكل عميل أثناء الإصدارات. كل الصور والتصاميم ملك لكابتريس.",
    ],
    ku: [
      "نرخەکان بە دیناری عێراقین. داواکاری دوای تەواوبوونی پارەدان لە ڕێگەی وەیلەوە و وەرگرتنی ژمارەی داواکاری پشتڕاستدەکرێتەوە.",
      "بەرهەمەکانی میرات ژمارەیان سنووردارە؛ لە کاتی بڵاوکردنەوەدا لەوانەیە ژمارە بۆ هەر کڕیارێک دیاریبکرێت. هەموو وێنە و دیزاینەکان موڵکی کاپیترێسن.",
    ],
  };
  return copy[locale].join("\n\n");
}

function shippingReturnsBody(locale: Locale): string {
  const flatDomestic = formatIQD(SHIPPING_RATE_IQ, locale);
  const flatIntl = formatCurrency(SHIPPING_RATE_INTL_USD * 100, "USD", locale);
  const threshold = formatIQD(FREE_SHIPPING_THRESHOLD, locale);
  const copy: Record<
    Locale,
    { intro: string; domesticTitle: string; domesticBody: string; intlTitle: string; intlBody: string; returnsTitle: string; returnsBody: string }
  > = {
    en: {
      intro: "We ship across every governorate of Iraq, and worldwide on request.",
      domesticTitle: "Iraq",
      domesticBody: `2–5 working days by trusted courier. Flat rate ${flatDomestic}; free on orders over ${threshold}. Cash on delivery is not available — payments are handled securely by Wayl before dispatch.`,
      intlTitle: "International",
      intlBody: `Flat rate ${flatIntl} worldwide, calculated automatically at checkout — this rate applies no matter the order value or destination country.`,
      returnsTitle: "Exchanges & returns",
      returnsBody:
        "Wrong size? You have 7 days from delivery to exchange, unworn with tags attached. Heritage drops are limited — refunds are issued to your original payment method via Wayl if we can't exchange.",
    },
    ar: {
      intro: "نشحن إلى كل محافظات العراق، وإلى العالم عند الطلب.",
      domesticTitle: "داخل العراق",
      domesticBody: `٢–٥ أيام عمل عبر شركات توصيل موثوقة. أجرة ثابتة ${flatDomestic}؛ ومجاناً للطلبات فوق ${threshold}. الدفع عند الاستلام غير متاح — تُعالج المدفوعات بأمان عبر ويل قبل الشحن.`,
      intlTitle: "خارج العراق",
      intlBody: `أجرة ثابتة ${flatIntl} إلى أي مكان في العالم، تُحتسب تلقائياً عند إتمام الطلب — وتُطبَّق هذه الأجرة بغض النظر عن قيمة الطلب أو بلد الوجهة.`,
      returnsTitle: "الاستبدال والإرجاع",
      returnsBody:
        "المقاس غير مناسب؟ لديك ٧ أيام من الاستلام للاستبدال، بشرط عدم الاستخدام وبقاء البطاقات. إصدارات التراث محدودة — يُعاد المبلغ إلى وسيلة الدفع الأصلية عبر ويل إذا تعذّر الاستبدال.",
    },
    ku: {
      intro: "بۆ هەموو پارێزگاکانی عێراق دەگەیەنین، و بە داواکاری بۆ هەموو جیهان.",
      domesticTitle: "ناو عێراق",
      domesticBody: `٢–٥ ڕۆژی کار بە گەیاندنی متمانەپێکراو. کرێی جێگیر ${flatDomestic}؛ بەخۆڕایی بۆ داواکاری سەرووی ${threshold}. پارەدان لە کاتی وەرگرتن بەردەست نییە — پارەدانەکان پێش ناردن بە پارێزراوی لە ڕێگەی وەیلەوە جێبەجێدەکرێن.`,
      intlTitle: "دەرەوەی عێراق",
      intlBody: `کرێی جێگیر ${flatIntl} بۆ هەموو جیهان، لە کاتی تەواوکردنی داواکاری بە شێوەیەکی ئۆتۆماتیکی دەژمێردرێت — ئەم کرێیە بەبێ گوێدانە بڕی داواکاری یان وڵاتی مەبەست جێبەجێ دەکرێت.`,
      returnsTitle: "گۆڕینەوە و گەڕاندنەوە",
      returnsBody:
        "قەبارەکە نەگونجا؟ ٧ ڕۆژت هەیە لە گەیشتنەوە بۆ گۆڕینەوە، بە مەرجی لەبەرنەکردن و مانەوەی تاگەکان. بەرهەمەکانی میرات سنووردارن — ئەگەر گۆڕینەوە نەکرا، پارەکە لە ڕێگەی وەیلەوە دەگەڕێتەوە بۆ هەمان شێوازی پارەدان.",
    },
  };
  const c = copy[locale];
  return `${c.intro}\n\n## ${c.domesticTitle}\n\n${c.domesticBody}\n\n## ${c.intlTitle}\n\n${c.intlBody}\n\n## ${c.returnsTitle}\n\n${c.returnsBody}`;
}

const SIZE_GUIDE_TEES: [string, number, number, number][] = [
  ["S", 54, 68, 20],
  ["M", 57, 70, 21],
  ["L", 60, 72, 22],
  ["XL", 63, 74, 23],
  ["2XL", 66, 76, 24],
];
const SIZE_GUIDE_OUTERWEAR: [string, number, number, number][] = [
  ["M", 60, 68, 62],
  ["L", 63, 70, 63.5],
  ["XL", 66, 72, 65],
  ["2XL", 69, 74, 66.5],
];

function sizeGuideBody(locale: Locale): string {
  const cm = locale === "en" ? "cm" : "سم";
  const copy: Record<
    Locale,
    { intro: string; teesTitle: string; outerwearTitle: string; chest: string; length: string; sleeve: string; fitNote: string }
  > = {
    en: {
      intro:
        "Measurements are garment measurements in centimetres, taken flat. Between sizes? Size up — our heritage fits are cut relaxed.",
      teesTitle: "Tees & Jerseys",
      outerwearTitle: "Outerwear",
      chest: "chest",
      length: "length",
      sleeve: "sleeve",
      fitNote: "Model wears size L. Heritage tees are boxy through the chest with a dropped shoulder.",
    },
    ar: {
      intro: "القياسات بالسنتيمتر مأخوذة للقطعة مفرودة. بين مقاسين؟ اختر الأكبر — قصّات التراث لدينا مريحة.",
      teesTitle: "التيشيرتات والقمصان",
      outerwearTitle: "الجاكيتات",
      chest: "الصدر",
      length: "الطول",
      sleeve: "الكم",
      fitNote: "العارض يرتدي مقاس L. تيشيرتات التراث واسعة عند الصدر مع كتف نازل.",
    },
    ku: {
      intro: "پێوانەکان بە سەنتیمەترن و بۆ پارچەی ڕاخراو وەرگیراون. لە نێوان دوو قەبارەدای؟ گەورەکە هەڵبژێرە — بڕینەکانی میراتمان بەرفراوانن.",
      teesTitle: "تیشێرت و کراسی وەرزشی",
      outerwearTitle: "چاکەت",
      chest: "سنگ",
      length: "درێژی",
      sleeve: "قۆڵ",
      fitNote: "مۆدێلەکە قەبارەی L لەبەرکردووە. تیشێرتەکانی میرات لە سنگدا بەرفراوانن و شانیان شۆڕبووەوەیە.",
    },
  };
  const c = copy[locale];
  const rows = (data: [string, number, number, number][]) =>
    data
      .map(
        ([size, chest, length, sleeve]) =>
          `${size} — ${c.chest} ${localizeDigits(chest, locale)}${cm}, ${c.length} ${localizeDigits(length, locale)}${cm}, ${c.sleeve} ${localizeDigits(sleeve, locale)}${cm}`,
      )
      .join("\n");
  return `${c.intro}\n\n## ${c.teesTitle}\n\n${rows(SIZE_GUIDE_TEES)}\n\n## ${c.outerwearTitle}\n\n${rows(SIZE_GUIDE_OUTERWEAR)}\n\n${c.fitNote}`;
}

const LEGAL_PAGE_TITLES: Record<string, Record<Locale, string>> = {
  privacy: { en: "Privacy Policy", ar: "سياسة الخصوصية", ku: "سیاسەتی تایبەتمەندێتی" },
  terms: { en: "Terms of Service", ar: "شروط الخدمة", ku: "مەرجەکانی خزمەتگوزاری" },
  "shipping-returns": { en: "Shipping & Returns", ar: "الشحن والإرجاع", ku: "گەیاندن و گەڕاندنەوە" },
  "size-guide": { en: "Size Guide", ar: "دليل المقاسات", ku: "ڕێبەری قەبارە" },
};

const LEGAL_PAGE_BODIES: Record<string, (locale: Locale) => string> = {
  privacy: privacyBody,
  terms: termsBody,
  "shipping-returns": shippingReturnsBody,
  "size-guide": sizeGuideBody,
};

/* ------------------------------------------------------------------ */

async function main() {
  console.log(`[migrate] connecting to ${process.env.DATABASE_URL!.replace(/:[^:@]*@/, ":***@")}`);

  console.log("[migrate] applying schema.sql");
  const schema = readFileSync(path.join(ROOT, "src/lib/db/schema.sql"), "utf8");
  await sql.unsafe(schema);

  const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
  if (ownerEmail) {
    await sql`
      insert into admin_allowlist (email) values (${ownerEmail})
      on conflict (email) do nothing
    `;
    console.log(`[migrate] admin allowlist: ensured ${ownerEmail}`);
  } else {
    console.log("[migrate] admin allowlist: ADMIN_OWNER_EMAIL not set, skipping seed");
  }

  // The demo catalog (seedProducts/seedCollections) is a local-dev bootstrap
  // fixture only — it exists so a fresh `db:dev` has something to look at,
  // not as real inventory. It's local-only rather than just "run once"
  // because ON CONFLICT DO NOTHING keys on slug: a real collection/product
  // an admin later creates under a *different* slug never collides with
  // it, so running this against a production database that already has
  // its own real catalog re-inserts the demo rows right alongside it every
  // time (this has happened twice — see git history). seedPosts is exempt:
  // those 3 posts are genuine launch content, not throwaway demo data.
  if (!isLocal) {
    console.log(
      `[migrate] products: skipped (demo catalog is local-dev only, ${seedProducts.length} available)`,
    );
    console.log(
      `[migrate] collections: skipped (demo catalog is local-dev only, ${seedCollections.length} available)`,
    );
  }

  let productsInserted = 0;
  for (const p of isLocal ? seedProducts : []) {
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
  if (isLocal) {
    console.log(`[migrate] products: ${productsInserted} inserted, ${seedProducts.length - productsInserted} already present`);
  }

  let collectionsInserted = 0;
  for (const c of isLocal ? seedCollections : []) {
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
  if (isLocal) {
    console.log(`[migrate] collections: ${collectionsInserted} inserted, ${seedCollections.length - collectionsInserted} already present`);
  }

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

  let legalPagesInserted = 0;
  const legalSlugs = Object.keys(LEGAL_PAGE_TITLES);
  for (const slug of legalSlugs) {
    const titles = LEGAL_PAGE_TITLES[slug];
    const bodyFor = LEGAL_PAGE_BODIES[slug];
    const inserted = await sql`
      insert into legal_pages (slug, title_en, title_ar, title_ku, body_en, body_ar, body_ku)
      values (
        ${slug}, ${titles.en}, ${titles.ar}, ${titles.ku},
        ${bodyFor("en")}, ${bodyFor("ar")}, ${bodyFor("ku")}
      )
      on conflict (slug) do nothing
      returning slug
    `;
    if (inserted.length > 0) legalPagesInserted++;
  }
  console.log(`[migrate] legal pages: ${legalPagesInserted} inserted, ${legalSlugs.length - legalPagesInserted} already present`);

  console.log("[migrate] done");
  await sql.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
