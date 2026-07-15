/**
 * Portable copy of the original hardcoded catalog (src/lib/catalog/data/*)
 * for one-time migration into Postgres. Image `key`s are paths relative to
 * src/images/ — migrate.ts copies the real files and resolves them to a
 * public URL; this file itself never touches Next's asset pipeline, so it
 * can run under plain `tsx` outside of Next.
 *
 * This is a migration fixture, not the app's source of truth — once
 * migrated, the database is authoritative and this file is not read again.
 */

export interface SeedLocalized {
  en: string;
  ar: string;
  ku: string;
}
export interface SeedImage {
  key: string;
  alt: SeedLocalized;
}
export interface SeedVariant {
  size: string;
  stock: number;
}
export interface SeedColor {
  key: string;
  hex: string;
  name: SeedLocalized;
}
export interface SeedReview {
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
  text: string;
}

export interface SeedProduct {
  slug: string;
  title: SeedLocalized;
  description: SeedLocalized;
  story?: SeedLocalized;
  details: SeedLocalized[];
  category: string;
  gender: string;
  priceAmount: number;
  compareAtAmount?: number;
  colors: SeedColor[];
  variants: SeedVariant[];
  images: SeedImage[];
  collectionSlugs: string[];
  isNew?: boolean;
  featured?: boolean;
  releaseDate: string;
  reviews: SeedReview[];
  giftCardDenominations?: number[];
}

export interface SeedCollection {
  slug: string;
  title: SeedLocalized;
  tagline: SeedLocalized;
  description: SeedLocalized;
  heroImage: SeedImage;
  theme: "dark" | "light";
  archived?: boolean;
  order: number;
}

export type SeedPostBlock =
  | { type: "p"; text: SeedLocalized }
  | { type: "h2"; text: SeedLocalized }
  | { type: "quote"; text: SeedLocalized; attribution?: SeedLocalized }
  | { type: "image"; image: SeedImage };

export interface SeedPost {
  slug: string;
  title: SeedLocalized;
  excerpt: SeedLocalized;
  cover: SeedImage;
  date: string;
  readingMinutes: number;
  author: string;
  relatedProductSlugs: string[];
  body: SeedPostBlock[];
}

const sizesTee = ["S", "M", "L", "XL", "2XL"];
const sizesJersey = ["M", "L", "XL", "2XL"];

function variants(
  sizes: string[],
  stock: Record<string, number> | number,
): SeedVariant[] {
  return sizes.map((size) => ({
    size,
    stock: typeof stock === "number" ? stock : (stock[size] ?? 0),
  }));
}

export const seedProducts: SeedProduct[] = [
  {
    slug: "iraq-84",
    title: { en: "Iraq 84 Tee", ar: "تيشيرت العراق ٨٤", ku: "تیشێرتی عێراق ٨٤" },
    description: {
      en: "Heavyweight cotton tee inspired by the shirt Iraq wore at the Los Angeles 1984 Olympic Games. Maroon and off-white — the elegant palette of a generation that wrote its name among the game's greats.",
      ar: "تيشيرت قطني ثقيل مستوحى من القميص الذي ارتداه المنتخب العراقي في أولمبياد لوس أنجلس ١٩٨٤. الماروني والأوف وايت — لوحة ألوان أنيقة لجيل خطّ اسمه بين كبار اللعبة.",
      ku: "تیشێرتی لۆکەی قورس بە ئیلهام لەو کراسەی عێراق لە ئۆڵۆمپیادی لۆس ئەنجلس ١٩٨٤ لەبەری کرد. مارۆنی و ئۆف وایت — ڕەنگە جوانەکانی ئەو نەوەیەی ناوی خۆی لەنێو گەورەکانی یارییەکەدا نووسی.",
    },
    story: {
      en: "Los Angeles 1984 — where the dream began. Inspired by the shirt the Iraqi national team wore at the Los Angeles Olympic Games, this cotton tee embodies one of the most important chapters in Iraqi football history. Maroon and off-white revive the elegant, distinctive character of the generation that wrote its name among the world's great teams.",
      ar: "Los Angeles 1984 – بداية الحلم. مستوحى من القميص الذي ارتداه المنتخب العراقي في دورة الألعاب الأولمبية في لوس أنجلِس 1984، يأتي هذا التيشيرت القطني ليجسد واحدة من أهم المحطات في تاريخ الكرة العراقية. ألوان الماروني والأوف وايت تعيد إحياء الطابع الأنيق والمميز لذلك الجيل الذي خطّ اسمه بين كبار المنتخبات على الساحة الدولية.",
      ku: "لۆس ئەنجلس ١٩٨٤ — دەستپێکی خەونەکە. بە ئیلهام لەو کراسەی هەڵبژاردەی عێراق لە یارییە ئۆڵۆمپیادییەکانی لۆس ئەنجلس لەبەری کرد، ئەم تیشێرتە لۆکەییە یەکێک لە گرنگترین وێستگەکانی مێژووی تۆپی پێی عێراق دەگێڕێتەوە. مارۆنی و ئۆف وایت کەسایەتییە جوان و تایبەتەکەی ئەو نەوەیە زیندوو دەکەنەوە کە ناوی خۆی لەنێو گەورە هەڵبژاردەکانی جیهاندا نووسی.",
    },
    details: [
      { en: "240 gsm heavyweight combed cotton", ar: "قطن ممشط ثقيل ٢٤٠ غم/م²", ku: "لۆکەی شانەکراوی قورس ٢٤٠ گم/م²" },
      { en: "Boxy heritage fit with dropped shoulder", ar: "قصّة تراثية واسعة بكتف نازل", ku: "بڕینی میراتی بەرفراوان بە شانی شۆڕ" },
      { en: "Archive-referenced chest print", ar: "طبعة صدر مستندة إلى الأرشيف", ku: "چاپی سنگ لە ئەرشیفەوە وەرگیراو" },
      { en: "Cold wash, inside out. Do not tumble dry.", ar: "غسيل بارد مقلوباً. لا يُجفف بالمجفف.", ku: "بە ئاوی سارد و پێچەوانە بیشۆ. وشککەرەوە بەکارمەهێنە." },
    ],
    category: "tees",
    gender: "unisex",
    priceAmount: 65_000,
    colors: [{ key: "off-white", hex: "#F5F4F6", name: { en: "Off-White / Maroon", ar: "أوف وايت / ماروني", ku: "ئۆف وایت / مارۆنی" } }],
    variants: variants(sizesTee, { S: 4, M: 8, L: 10, XL: 6, "2XL": 3 }),
    images: [
      {
        key: "products/iraq-84.jpg",
        alt: {
          en: "Iraq 84 heritage tee — off-white with maroon chest print",
          ar: "تيشيرت العراق ٨٤ التراثي — أوف وايت بطبعة صدر مارونية",
          ku: "تیشێرتی میراتی عێراق ٨٤ — ئۆف وایت بە چاپی سنگی مارۆنی",
        },
      },
    ],
    collectionSlugs: ["heritage-capsule"],
    featured: true,
    releaseDate: "2026-05-14",
    reviews: [
      { author: "Mustafa K.", rating: 5, date: "2026-06-02", text: "القماش ثقيل والطبعة نظيفة جداً. لبسته يوم مباراة المنتخب وكل الناس سألتني منين اشتريته." },
      { author: "Sara A.", rating: 5, date: "2026-06-18", text: "Bought it for my dad who watched the '84 squad live. He didn't take it off for a week." },
      { author: "هێمن", rating: 4, date: "2026-06-25", text: "قوماشەکەی زۆر باشە و قەبارەکەی وەک خۆیەتی. تەنیا گەیاندنەکە دوو ڕۆژ دواکەوت." },
    ],
  },
  {
    slug: "iraq-40-jersey",
    title: { en: "Iraq 40 Jersey", ar: "قميص العراق ٤٠", ku: "کراسی عێراق ٤٠" },
    description: {
      en: "A matchday jersey for the fortieth chapter — desert taupe body, tonal collar, breathable knit. Built for the terraces in July and the street in October.",
      ar: "قميص يوم المباراة للفصل الأربعين — لون ترابي صحراوي، وياقة متناغمة، ونسيج يتنفس. صُنع للمدرجات في تموز وللشارع في تشرين.",
      ku: "کراسی ڕۆژی یاری بۆ بەشی چلەم — ڕەنگی خۆڵەمێشی بیابانی، یەخەی هاوڕەنگ، و چنینێک کە هەناسە دەدات. بۆ تریبوونەکان لە تەمموز و بۆ شەقام لە تشرین دروستکراوە.",
    },
    story: {
      en: "Forty years separate the boys of '84 from today's faithful. The Iraq 40 Jersey bridges them — a modern cut carrying four decades of chants, heartbreak and impossible comebacks.",
      ar: "أربعون عاماً تفصل فتية ٨٤ عن جمهور اليوم. قميص العراق ٤٠ يصل بينهما — قصّة عصرية تحمل أربعة عقود من الهتاف والانكسار والعودات المستحيلة.",
      ku: "چل ساڵ کوڕانی ٨٤ لە دڵسۆزانی ئەمڕۆ جیادەکاتەوە. کراسی عێراق ٤٠ پەیوەندییان پێکەوە دەکات — بڕینێکی هاوچەرخ کە چوار دەیە هاوار و دڵشکان و گەڕانەوەی نەگونجاو هەڵدەگرێت.",
    },
    details: [
      { en: "Breathable jacquard knit, 165 gsm", ar: "نسيج جاكار يتنفس، ١٦٥ غم/م²", ku: "چنینی جاکاردی هەناسەدار، ١٦٥ گم/م²" },
      { en: "Embroidered crest, numbered hem tag", ar: "شعار مطرز وبطاقة حاشية مرقمة", ku: "نیشانەی دورماوکراو و تاگی ژمارەدار" },
      { en: "Athletic fit — size up for a terrace fit", ar: "قصّة رياضية — اختر مقاساً أكبر لإطلالة المدرجات", ku: "بڕینی وەرزشی — بۆ ستایلی تریبوون قەبارەیەک گەورەتر ببە" },
    ],
    category: "jerseys",
    gender: "unisex",
    priceAmount: 75_000,
    colors: [{ key: "desert-taupe", hex: "#736158", name: { en: "Desert Taupe", ar: "ترابي صحراوي", ku: "خۆڵەمێشی بیابانی" } }],
    variants: variants(sizesJersey, { M: 7, L: 9, XL: 5, "2XL": 2 }),
    images: [
      {
        key: "products/iraq-40-jersey.jpg",
        alt: {
          en: "Iraq 40 jersey in desert taupe with tonal collar",
          ar: "قميص العراق ٤٠ باللون الترابي الصحراوي وياقة متناغمة",
          ku: "کراسی عێراق ٤٠ بە ڕەنگی خۆڵەمێشی بیابانی و یەخەی هاوڕەنگ",
        },
      },
    ],
    collectionSlugs: ["matchday"],
    isNew: true,
    featured: true,
    releaseDate: "2026-06-20",
    reviews: [
      { author: "Ali H.", rating: 5, date: "2026-06-28", text: "Quality is on another level compared to the bootleg jerseys in the market. The hem tag detail is class." },
      { author: "نور", rating: 4, date: "2026-07-01", text: "القماش خفيف ومريح بس تمنيت لو أكو ألوان ثانية. المقاس مضبوط." },
    ],
  },
  {
    slug: "iraq-88",
    title: { en: "Iraq 88 Tee", ar: "تيشيرت العراق ٨٨", ku: "تیشێرتی عێراق ٨٨" },
    description: {
      en: "Ink-black heavyweight tee marking 1988 — a year of defiance played out under floodlights. Minimal front, archive print across the back.",
      ar: "تيشيرت أسود ثقيل يوثّق عام ١٩٨٨ — عام من التحدي تحت الأضواء الكاشفة. واجهة بسيطة وطبعة أرشيفية على الظهر.",
      ku: "تیشێرتی ڕەشی قورس بۆ ساڵی ١٩٨٨ — ساڵێکی بەرەنگاری لەژێر پرۆژەکتەرەکاندا. پێشەوەیەکی سادە و چاپێکی ئەرشیفی لە پشتەوە.",
    },
    details: [
      { en: "240 gsm heavyweight combed cotton", ar: "قطن ممشط ثقيل ٢٤٠ غم/م²", ku: "لۆکەی شانەکراوی قورس ٢٤٠ گم/م²" },
      { en: "Back archive print, tonal neck tape", ar: "طبعة أرشيفية على الظهر وشريط رقبة متناغم", ku: "چاپی ئەرشیفی لە پشت و شریتی ملی هاوڕەنگ" },
    ],
    category: "tees",
    gender: "unisex",
    priceAmount: 65_000,
    colors: [{ key: "ink", hex: "#2B2A27", name: { en: "Ink", ar: "أسود حبري", ku: "ڕەشی مەرەکەبی" } }],
    variants: variants(sizesTee, 0),
    images: [
      {
        key: "products/iraq-88.jpg",
        alt: { en: "Iraq 88 tee in ink black", ar: "تيشيرت العراق ٨٨ بالأسود الحبري", ku: "تیشێرتی عێراق ٨٨ بە ڕەشی مەرەکەبی" },
      },
    ],
    collectionSlugs: ["heritage-capsule"],
    releaseDate: "2026-04-02",
    reviews: [
      { author: "Dler M.", rating: 5, date: "2026-05-11", text: "Sold out twice for a reason. Print quality survived a whole season of washes." },
    ],
  },
  {
    slug: "90s-jacket",
    title: { en: "90's Jacket", ar: "جاكيت التسعينات", ku: "چاکەتی نەوەدەکان" },
    description: {
      en: "A warm-up jacket cut from the VHS era — black shell, cream panelling, snap front. The kind of jacket the kit man never got back.",
      ar: "جاكيت إحماء بقصّة من زمن أشرطة الفيديو — جسم أسود، وقطع كريمية، وأزرار كبس أمامية. من النوع الذي لا يعود إلى مسؤول العهدة أبداً.",
      ku: "چاکەتی گەرمکردنەوە بە بڕینی سەردەمی VHS — لاشەی ڕەش، پارچەی کرێمی، و دوگمەی تەقە. لەو چاکەتانەی کە هەرگیز ناگەڕێنەوە لای بەرپرسی جلەکان.",
    },
    details: [
      { en: "Water-resistant nylon shell, brushed lining", ar: "نايلون مقاوم للماء وبطانة ناعمة", ku: "نایلۆنی دژە ئاو و ناوپۆشی نەرم" },
      { en: "Snap front, elastic cuffs, twin welt pockets", ar: "أزرار كبس، وأساور مطاطية، وجيبان جانبيان", ku: "دوگمەی تەقە، مەچەکی لاستیکی، دوو گیرفانی لاتەنیشت" },
    ],
    category: "outerwear",
    gender: "unisex",
    priceAmount: 65_000,
    colors: [{ key: "black-cream", hex: "#1A1315", name: { en: "Black / Cream", ar: "أسود / كريمي", ku: "ڕەش / کرێمی" } }],
    variants: variants(sizesJersey, { M: 5, L: 6, XL: 4, "2XL": 2 }),
    images: [
      {
        key: "products/90s-jacket.jpg",
        alt: { en: "90's warm-up jacket in black with cream panels", ar: "جاكيت إحماء التسعينات بالأسود مع قطع كريمية", ku: "چاکەتی گەرمکردنەوەی نەوەدەکان بە ڕەش و پارچەی کرێمی" },
      },
    ],
    collectionSlugs: ["matchday"],
    isNew: true,
    releaseDate: "2026-06-05",
    reviews: [
      { author: "Zainab R.", rating: 5, date: "2026-06-21", text: "احلى جاكيت اشتريته هالسنة. القصة والخامة تحسها من التسعينات فعلاً." },
    ],
  },
  {
    slug: "amo-baba",
    title: { en: "Amo Baba Tee", ar: "تيشيرت عمو بابا", ku: "تیشێرتی عەمۆ بابا" },
    description: {
      en: "A tribute in stone-grey cotton to Ammo Baba — player, coach, father of Iraqi football. Portrait print drawn from the archive.",
      ar: "تحية بقطن رمادي حجري إلى عمو بابا — اللاعب والمدرب وأبو الكرة العراقية. طبعة بورتريه مأخوذة من الأرشيف.",
      ku: "ڕێزلێنانێک بە لۆکەی خۆڵەمێشی بەردین بۆ عەمۆ بابا — یاریزان، ڕاهێنەر، باوکی تۆپی پێی عێراق. چاپی پۆرترەیت لە ئەرشیفەوە.",
    },
    story: {
      en: "Before the trophies, before the academies, there was a man on the touchline in a tracksuit, demanding more. Ammo Baba gave Iraqi football its spine. This one is for him.",
      ar: "قبل الكؤوس وقبل الأكاديميات، كان هناك رجل على خط التماس ببدلة رياضية يطالب بالمزيد. عمو بابا منح الكرة العراقية عمودها الفقري. هذه القطعة له.",
      ku: "پێش جامەکان و پێش ئەکادیمیاکان، پیاوێک لەسەر هێڵی یاری بە جلی وەرزشییەوە داوای زیاتری دەکرد. عەمۆ بابا بڕبڕەی پشتی بە تۆپی پێی عێراق بەخشی. ئەمە بۆ ئەوە.",
    },
    details: [
      { en: "220 gsm cotton, relaxed fit", ar: "قطن ٢٢٠ غم/م² بقصّة مريحة", ku: "لۆکەی ٢٢٠ گم/م²، بڕینی ئاسوودە" },
      { en: "Archive portrait print", ar: "طبعة بورتريه أرشيفية", ku: "چاپی پۆرترەیتی ئەرشیفی" },
    ],
    category: "tees",
    gender: "unisex",
    priceAmount: 50_000,
    colors: [{ key: "stone", hex: "#9B9191", name: { en: "Stone", ar: "رمادي حجري", ku: "خۆڵەمێشی بەردین" } }],
    variants: variants(sizesTee, { S: 6, M: 9, L: 8, XL: 5, "2XL": 4 }),
    images: [
      {
        key: "products/amo-baba.jpg",
        alt: { en: "Amo Baba tribute tee in stone grey", ar: "تيشيرت عمو بابا بالرمادي الحجري", ku: "تیشێرتی عەمۆ بابا بە خۆڵەمێشی بەردین" },
      },
    ],
    collectionSlugs: ["essentials"],
    isNew: true,
    featured: true,
    releaseDate: "2026-06-28",
    reviews: [
      { author: "Omar T.", rating: 5, date: "2026-07-03", text: "جدي كان يحچيلي عن عمو بابا من كنت صغير. لبستها وأخذتله صورة — بكى الرجال." },
      { author: "Lana S.", rating: 5, date: "2026-07-06", text: "The portrait print is beautiful and respectful. Fits true to size." },
    ],
  },
  {
    slug: "iraq-70",
    title: { en: "IRAQ 70 Tee", ar: "تيشيرت العراق ٧٠", ku: "تیشێرتی عێراق ٧٠" },
    description: {
      en: "Terracotta and sand — the palette of 1970s football photography. A sun-faded tribute to the pioneers who built the foundations.",
      ar: "تيراكوتا ورملي — ألوان صور كرة السبعينات. تحية بلون الشمس الباهتة للروّاد الذين وضعوا الأساس.",
      ku: "تیراکۆتا و لمی — ڕەنگەکانی وێنەگری تۆپی پێی حەفتاکان. ڕێزلێنانێکی خۆرهەڵهاتوو بۆ پێشەنگەکان کە بناغەکەیان داڕشت.",
    },
    details: [
      { en: "Garment-dyed 230 gsm cotton", ar: "قطن مصبوغ بعد الحياكة ٢٣٠ غم/م²", ku: "لۆکەی ٢٣٠ گم/م² دوای دورمان ڕەنگکراو" },
      { en: "Faded retro front print", ar: "طبعة أمامية ريترو باهتة", ku: "چاپی پێشەوەی ڕێترۆی کاڵبووەوە" },
    ],
    category: "tees",
    gender: "unisex",
    priceAmount: 55_000,
    colors: [{ key: "terracotta", hex: "#926149", name: { en: "Terracotta", ar: "تيراكوتا", ku: "تیراکۆتا" } }],
    variants: variants(sizesTee, 0),
    images: [
      {
        key: "products/iraq-70.jpg",
        alt: { en: "IRAQ 70 tee in sun-faded terracotta", ar: "تيشيرت العراق ٧٠ بلون التيراكوتا الباهت", ku: "تیشێرتی عێراق ٧٠ بە تیراکۆتای کاڵبووەوە" },
      },
    ],
    collectionSlugs: ["heritage-capsule"],
    releaseDate: "2026-03-10",
    reviews: [],
  },
  {
    slug: "iraq-80s-heritage",
    title: { en: "Iraq 80's Heritage Tee", ar: "تيشيرت تراث الثمانينات", ku: "تیشێرتی میراتی هەشتاکان" },
    description: {
      en: "Pitch-green chest hit on studio white — the loudest quiet tee in the capsule. An everyday flag for the golden decade.",
      ar: "أخضر الملعب على أبيض الاستوديو — أهدأ تيشيرت وأعلاه صوتاً في الكبسولة. راية يومية للعقد الذهبي.",
      ku: "سەوزی یاریگا لەسەر سپی ستۆدیۆ — بێدەنگترین و بەرزترین تیشێرتی کۆلێکشنەکە. ئاڵایەکی ڕۆژانە بۆ دەیە زێڕینەکە.",
    },
    details: [
      { en: "220 gsm cotton, regular fit", ar: "قطن ٢٢٠ غم/م² بقصّة عادية", ku: "لۆکەی ٢٢٠ گم/م²، بڕینی ئاسایی" },
      { en: "High-density pitch-green print", ar: "طبعة خضراء عالية الكثافة", ku: "چاپی سەوزی چڕی بەرز" },
    ],
    category: "tees",
    gender: "unisex",
    priceAmount: 39_000,
    compareAtAmount: 55_000,
    colors: [{ key: "pitch-green", hex: "#065E37", name: { en: "Pitch Green", ar: "أخضر الملعب", ku: "سەوزی یاریگا" } }],
    variants: variants(sizesTee, { S: 2, M: 5, L: 7, XL: 3, "2XL": 1 }),
    images: [
      {
        key: "products/iraq-80s-heritage.jpg",
        alt: { en: "Iraq 80's heritage tee — white with pitch-green print", ar: "تيشيرت تراث الثمانينات — أبيض بطبعة خضراء", ku: "تیشێرتی میراتی هەشتاکان — سپی بە چاپی سەوز" },
      },
    ],
    collectionSlugs: ["heritage-capsule", "essentials"],
    releaseDate: "2026-02-01",
    reviews: [
      { author: "Yousif B.", rating: 4, date: "2026-03-15", text: "Great daily tee. The green print is exactly the national team green." },
    ],
  },
  {
    slug: "gift-card",
    title: { en: "Capitres Gift Card", ar: "بطاقة هدايا كابتريس", ku: "کارتی دیاری کاپیترێس" },
    description: {
      en: "For the one who never stopped believing. Delivered by email with your message, redeemable on everything, valid 24 months.",
      ar: "لمن لم يتوقف يوماً عن الإيمان. تُرسل بالبريد الإلكتروني مع رسالتك، وتُستخدم على كل شيء، وصالحة ٢٤ شهراً.",
      ku: "بۆ ئەو کەسەی هەرگیز لە باوەڕ نەوەستا. بە ئیمەیڵ لەگەڵ پەیامەکەت دەگەیەنرێت، بۆ هەموو شتێک بەکاردێت، ٢٤ مانگ کاردەکات.",
    },
    details: [
      { en: "Digital delivery by email", ar: "تسليم رقمي عبر البريد الإلكتروني", ku: "گەیاندنی دیجیتاڵ بە ئیمەیڵ" },
      { en: "Redeemable at checkout on any product", ar: "تُستخدم عند إتمام الطلب على أي منتج", ku: "لە کاتی کڕیندا بۆ هەر بەرهەمێک بەکاردێت" },
    ],
    category: "gift-cards",
    gender: "unisex",
    priceAmount: 25_000,
    colors: [],
    variants: [{ size: "DIGITAL", stock: 9999 }],
    images: [
      {
        key: "brand/wordmark.png",
        alt: { en: "Capitres gift card with the brand wordmark", ar: "بطاقة هدايا كابتريس بشعار العلامة", ku: "کارتی دیاری کاپیترێس بە نیشانەی براند" },
      },
    ],
    collectionSlugs: [],
    releaseDate: "2026-01-01",
    reviews: [],
    giftCardDenominations: [25_000, 50_000, 100_000, 250_000],
  },
];

export const seedCollections: SeedCollection[] = [
  {
    slug: "heritage-capsule",
    title: { en: "Heritage Capsule", ar: "كبسولة التراث", ku: "کۆلێکشنی میرات" },
    tagline: { en: "1984. Los Angeles. The dream begins.", ar: "١٩٨٤. لوس أنجلس. بداية الحلم.", ku: "١٩٨٤. لۆس ئەنجلس. دەستپێکی خەونەکە." },
    description: {
      en: "The kits that made a nation believe, rebuilt from the archive — Olympic olive, floodlit nights and the decade football never gave back.",
      ar: "الأطقم التي جعلت أمة كاملة تؤمن، أُعيد بناؤها من الأرشيف — زيتوني الأولمبياد، وليالي الأضواء الكاشفة، والعقد الذي لم تُعده الكرة أبداً.",
      ku: "ئەو جلانەی نەتەوەیەکیان هێنایە باوەڕ، لە ئەرشیفەوە دروستکراونەتەوە — زەیتوونی ئۆڵۆمپیاد، شەوانی پرۆژەکتەر، و ئەو دەیەیەی تۆپی پێ هەرگیز نەیگەڕاندەوە.",
    },
    heroImage: {
      key: "products/iraq-84.jpg",
      alt: { en: "Iraq 84 heritage tee on studio backdrop", ar: "تيشيرت العراق ٨٤ التراثي على خلفية استوديو", ku: "تیشێرتی میراتی عێراق ٨٤ لەسەر باکگراوندی ستۆدیۆ" },
    },
    theme: "dark",
    order: 1,
  },
  {
    slug: "matchday",
    title: { en: "Matchday", ar: "يوم المباراة", ku: "ڕۆژی یاری" },
    tagline: { en: "Ninety minutes, worn all week.", ar: "تسعون دقيقة تُلبس طوال الأسبوع.", ku: "نەوەد خولەک، هەموو هەفتە لەبەرکراو." },
    description: {
      en: "Jerseys and warm-ups cut for the walk to the stadium — technical knits, archive details, nothing you have to take off on Monday.",
      ar: "قمصان وجاكيتات إحماء بقصّات لمشوار الملعب — أنسجة تقنية وتفاصيل أرشيفية، ولا شيء تضطر لخلعه يوم الاثنين.",
      ku: "کراس و چاکەتی گەرمکردنەوە بۆ ڕێگای یاریگا — چنینی تەکنیکی، وردەکاری ئەرشیفی، هیچ شتێک نییە کە ڕۆژی دووشەممە دایبکەنیت.",
    },
    heroImage: {
      key: "products/iraq-40-jersey.jpg",
      alt: { en: "Iraq 40 jersey in desert taupe", ar: "قميص العراق ٤٠ بالترابي الصحراوي", ku: "کراسی عێراق ٤٠ بە خۆڵەمێشی بیابانی" },
    },
    theme: "light",
    order: 2,
  },
  {
    slug: "essentials",
    title: { en: "Essentials", ar: "الأساسيات", ku: "بنەڕەتییەکان" },
    tagline: { en: "The everyday squad.", ar: "تشكيلة كل يوم.", ku: "تیمەکەی هەموو ڕۆژێک." },
    description: {
      en: "Heavyweight staples in studio tones — the pieces you reach for without thinking, with a story stitched in anyway.",
      ar: "قطع أساسية ثقيلة بألوان الاستوديو — القطع التي تمد يدك إليها بلا تفكير، وفيها حكاية مخيطة على أي حال.",
      ku: "پارچە بنەڕەتییە قورسەکان بە ڕەنگی ستۆدیۆ — ئەو پارچانەی بێ بیرکردنەوە بۆیان دەچیت، و لەگەڵ ئەوەشدا چیرۆکێکیان تێدا دوورماوە.",
    },
    heroImage: {
      key: "products/amo-baba.jpg",
      alt: { en: "Amo Baba tee in stone grey", ar: "تيشيرت عمو بابا بالرمادي الحجري", ku: "تیشێرتی عەمۆ بابا بە خۆڵەمێشی بەردین" },
    },
    theme: "light",
    order: 3,
  },
  {
    slug: "soughe-x-capitres",
    title: { en: "SOUGHE × CAPITRES", ar: "سوغة × كابتريس", ku: "سوغە × کاپیترێس" },
    tagline: { en: "Support Iraq — together.", ar: "شجع العراق — سوية.", ku: "پشتگیری عێراق بکە — پێکەوە." },
    description: {
      en: "Our first collaboration — a giveaway drop with SOUGHE celebrating the supporters. Sold through in days; archived here for the record.",
      ar: "أول تعاون لنا — إصدار مع سوغة احتفاءً بالجمهور. نفد خلال أيام؛ مؤرشف هنا للتوثيق.",
      ku: "یەکەم هاوکاریمان — بڵاوکردنەوەیەک لەگەڵ سوغە بۆ ئاهەنگگێڕان بە هاندەران. لە چەند ڕۆژێکدا فرۆشرا؛ لێرە بۆ تۆمار ئەرشیفکراوە.",
    },
    heroImage: {
      key: "brand/wordmark.png",
      alt: { en: "CAPITRES wordmark — Declare Your Passion", ar: "شعار كابتريس — أعلن شغفك", ku: "نیشانەی کاپیترێس — عەشقەکەت ڕابگەیەنە" },
    },
    theme: "dark",
    archived: true,
    order: 4,
  },
];

export const seedPosts: SeedPost[] = [
  {
    slug: "1984-los-angeles-the-dream-begins",
    title: { en: "1984, Los Angeles: The Dream Begins", ar: "١٩٨٤، لوس أنجلس: بداية الحلم", ku: "١٩٨٤، لۆس ئەنجلس: دەستپێکی خەونەکە" },
    excerpt: {
      en: "Why a single summer on Californian grass still shapes what we sew four decades later.",
      ar: "لماذا لا يزال صيف واحد على عشب كاليفورنيا يشكّل ما نخيطه بعد أربعة عقود.",
      ku: "بۆچی هاوینێک لەسەر چیمەنی کالیفۆرنیا هێشتا شێوەی ئەوە دەکات کە چوار دەیە دواتر دەیدوورین.",
    },
    cover: {
      key: "products/iraq-84.jpg",
      alt: { en: "Iraq 84 heritage tee", ar: "تيشيرت العراق ٨٤ التراثي", ku: "تیشێرتی میراتی عێراق ٨٤" },
    },
    date: "2026-06-12",
    readingMinutes: 4,
    author: "Capitres Editorial",
    relatedProductSlugs: ["iraq-84", "iraq-80s-heritage"],
    body: [
      { type: "p", text: {
        en: "Every brand has a founding image. Ours is a television set in a Baghdad living room in the summer of 1984, and eleven men in olive walking out under Californian sun.",
        ar: "لكل علامة صورة تأسيسية. صورتنا جهاز تلفزيون في صالة بغدادية صيف ١٩٨٤، وأحد عشر رجلاً بالزيتوني يخرجون تحت شمس كاليفورنيا.",
        ku: "هەموو براندێک وێنەیەکی دامەزراندنی هەیە. هی ئێمە تەلەفزیۆنێکە لە هۆڵێکی بەغدا لە هاوینی ١٩٨٤، و یازدە پیاو بە زەیتوونییەوە لەژێر خۆری کالیفۆرنیا دەردەچن.",
      } },
      { type: "p", text: {
        en: "The Los Angeles Olympics were not Iraq's first international stage, but they were the one that made the dream feel touchable. Qualification alone put a generation of kids in the street with a ball and a borrowed name on their back.",
        ar: "لم تكن أولمبياد لوس أنجلس أول محفل دولي للعراق، لكنها كانت المحطة التي جعلت الحلم ملموساً. التأهل وحده أنزل جيلاً كاملاً من الأطفال إلى الشارع بكرة واسم مستعار على الظهر.",
        ku: "ئۆڵۆمپیادی لۆس ئەنجلس یەکەم سەکۆی نێودەوڵەتی عێراق نەبوو، بەڵام ئەو وێستگەیە بوو کە خەونەکەی کردە شتێکی بەردەست. تەنیا دەرچوون بۆ ئۆڵۆمپیاد نەوەیەکی تەواوی منداڵانی خستە سەر شەقام بە تۆپێک و ناوێکی خوازراو لە پشتیان.",
      } },
      { type: "quote", text: {
        en: "Maroon and off-white — the elegant palette of a generation that wrote its name among the greats.",
        ar: "الماروني والأوف وايت — لوحة أنيقة لجيل خطّ اسمه بين الكبار.",
        ku: "مارۆنی و ئۆف وایت — ڕەنگە جوانەکانی نەوەیەک کە ناوی لەنێو گەورەکاندا نووسی.",
      }, attribution: {
        en: "From the Iraq 84 design notes", ar: "من ملاحظات تصميم العراق ٨٤", ku: "لە تێبینییەکانی دیزاینی عێراق ٨٤",
      } },
      { type: "h2", text: { en: "From archive to garment", ar: "من الأرشيف إلى القطعة", ku: "لە ئەرشیفەوە بۆ پارچە" } },
      { type: "p", text: {
        en: "The Iraq 84 tee began with photographs — the collar line, the weight of the cloth, the exact distance between crest and heart. We matched the maroon by eye against three surviving prints, then let a 240gsm cotton carry the memory.",
        ar: "بدأ تيشيرت العراق ٨٤ من الصور — خط الياقة، ووزن القماش، والمسافة الدقيقة بين الشعار والقلب. طابقنا الماروني بالعين على ثلاث صور باقية، ثم تركنا قطناً بوزن ٢٤٠ غراماً يحمل الذاكرة.",
        ku: "تیشێرتی عێراق ٨٤ لە وێنەکانەوە دەستیپێکرد — هێڵی یەخە، کێشی قوماش، و دووری وردی نێوان نیشانە و دڵ. مارۆنییەکەمان بە چاو لەگەڵ سێ وێنەی ماوە بەراورد کرد، پاشان وامانلێکرد لۆکەیەکی ٢٤٠ گرامی یادگارییەکە هەڵبگرێت.",
      } },
      { type: "p", text: {
        en: "Heritage is not a costume. It has to survive the wash, the crowd and the years — like the memory it carries.",
        ar: "التراث ليس زيّاً تنكرياً. عليه أن يصمد أمام الغسيل والجمهور والسنين — مثل الذاكرة التي يحملها.",
        ku: "میرات جلی شانۆ نییە. دەبێت لە شوشتن و قەرەباڵغی و ساڵەکاندا بمێنێتەوە — وەک ئەو یادگارییەی هەڵیدەگرێت.",
      } },
    ],
  },
  {
    slug: "ammo-baba-father-of-iraqi-football",
    title: { en: "Ammo Baba, Father of Iraqi Football", ar: "عمو بابا، أبو الكرة العراقية", ku: "عەمۆ بابا، باوکی تۆپی پێی عێراق" },
    excerpt: {
      en: "Player, coach, institution. The story behind the portrait on our stone-grey tee.",
      ar: "لاعب ومدرب ومؤسسة. الحكاية خلف البورتريه على تيشيرتنا الرمادي.",
      ku: "یاریزان، ڕاهێنەر، دامەزراوە. چیرۆکی پشت پۆرترەیتەکەی سەر تیشێرتە خۆڵەمێشییەکەمان.",
    },
    cover: {
      key: "products/amo-baba.jpg",
      alt: { en: "Amo Baba tribute tee", ar: "تيشيرت عمو بابا", ku: "تیشێرتی عەمۆ بابا" },
    },
    date: "2026-06-28",
    readingMinutes: 5,
    author: "Capitres Editorial",
    relatedProductSlugs: ["amo-baba"],
    body: [
      { type: "p", text: {
        en: "Some men score goals. Some men win cups. A very few become the reason a country plays the game at all. Emmanuel Baba Dawud — Ammo Baba to every kid who ever kicked a ball in Iraq — was the third kind.",
        ar: "بعض الرجال يسجلون الأهداف. وبعضهم يرفعون الكؤوس. وقلّة نادرة يصبحون السبب في أن بلداً كاملاً يلعب اللعبة أصلاً. عمانوئيل بابا داود — عمو بابا لكل طفل ركل كرة في العراق — كان من النوع الثالث.",
        ku: "هەندێک پیاو گۆڵ تۆماردەکەن. هەندێکیان جام دەبەنەوە. کەمێکی دەگمەن دەبنە هۆکاری ئەوەی وڵاتێک بە تەواوی یارییەکە بکات. عیمانوێل بابا داود — عەمۆ بابا بۆ هەموو منداڵێک کە لە عێراقدا تۆپێکی لێداوە — لە جۆری سێیەم بوو.",
      } },
      { type: "p", text: {
        en: "As a striker he terrorised defences across the fifties and sixties. As a coach he took the national team to Gulf Cup after Gulf Cup and refused to let standards drop, even when everything around the game was falling apart.",
        ar: "كمهاجم أرعب الدفاعات طوال الخمسينات والستينات. وكمدرب قاد المنتخب من خليجي إلى خليجي ورفض أن تتراجع المعايير حتى حين كان كل شيء حول اللعبة يتداعى.",
        ku: "وەک هێرشبەر لە پەنجاکان و شەستەکاندا بەرگرییەکانی دەترساند. وەک ڕاهێنەر هەڵبژاردەی نیشتمانی لە جامی کەنداوێکەوە بۆ یەکێکی تر برد و ڕازی نەبوو ئاستەکان دابەزن، تەنانەت کاتێک هەموو شتێک لە دەوری یارییەکە هەڵدەوەشایەوە.",
      } },
      { type: "h2", text: { en: "The touchline silhouette", ar: "ظلّه على خط التماس", ku: "سێبەرەکەی سەر هێڵی یاری" } },
      { type: "p", text: {
        en: "Late in life he poured what he had into a football school for orphans, coaching from a chair when his legs gave out. That silhouette — tracksuit, whistle, absolute authority — is the one we drew for the tee.",
        ar: "في أواخر حياته وهب ما يملك لمدرسة كرة قدم للأيتام، يدرّب من كرسيّه حين خذلته قدماه. ذلك الظل — بدلة رياضية وصافرة وهيبة مطلقة — هو ما رسمناه على التيشيرت.",
        ku: "لە کۆتایی ژیانیدا ئەوەی هەیبوو دای بە قوتابخانەیەکی تۆپی پێ بۆ هەتیوان، لە کورسییەکەوە ڕاهێنانی دەکرد کاتێک قاچەکانی وازیان لێهێنا. ئەو سێبەرە — جلی وەرزشی، فیکە، و دەسەڵاتی ڕەها — ئەوەیە کە بۆ تیشێرتەکە کێشامان.",
      } },
      { type: "quote", text: {
        en: "Before the trophies, there was a man on the touchline demanding more.",
        ar: "قبل الكؤوس، كان هناك رجل على خط التماس يطالب بالمزيد.",
        ku: "پێش جامەکان، پیاوێک لەسەر هێڵی یاری داوای زیاتری دەکرد.",
      } },
      { type: "p", text: {
        en: "Wear it like he coached: shoulders back, no excuses.",
        ar: "البسها كما كان يدرّب: كتفان مرفوعان وبلا أعذار.",
        ku: "وەک ئەو ڕاهێنانی دەکرد لەیبەرکە: شان بەرز، بێ بیانوو.",
      } },
    ],
  },
  {
    slug: "how-to-wear-a-heritage-jersey",
    title: { en: "How to Wear a Heritage Jersey", ar: "كيف ترتدي قميصاً تراثياً", ku: "چۆن کراسێکی میراتی لەبەر بکەیت" },
    excerpt: {
      en: "Five rules for taking a football shirt from the stands to dinner — without looking like you got lost on the way.",
      ar: "خمس قواعد لأخذ قميص الكرة من المدرجات إلى العشاء — دون أن تبدو وكأنك ضللت الطريق.",
      ku: "پێنج یاسا بۆ بردنی کراسی تۆپی پێ لە تریبوونەکانەوە بۆ نانی ئێوارە — بەبێ ئەوەی وا دەربکەویت ڕێگات ون کردووە.",
    },
    cover: {
      key: "products/iraq-40-jersey.jpg",
      alt: { en: "Iraq 40 jersey styled flat", ar: "قميص العراق ٤٠", ku: "کراسی عێراق ٤٠" },
    },
    date: "2026-07-05",
    readingMinutes: 3,
    author: "Capitres Editorial",
    relatedProductSlugs: ["iraq-40-jersey", "90s-jacket"],
    body: [
      { type: "p", text: {
        en: "The football jersey stopped being sportswear years ago. Worn right, it reads as intentional as any designer knit. Worn wrong, it reads like laundry day. Here is the difference.",
        ar: "توقف قميص الكرة عن كونه ملابس رياضية منذ سنوات. إن لُبس صحيحاً بدا مقصوداً كأي قطعة مصمّمة. وإن لُبس خطأً بدا كيوم الغسيل. هذا هو الفرق.",
        ku: "کراسی تۆپی پێ ساڵانێکە لە جلی وەرزشی بوون وەستاوە. بە دروستی لەبەر بکرێت، وەک هەر چنینێکی دیزاینەر مەبەستدار دەردەکەوێت. بە هەڵە لەبەر بکرێت، وەک ڕۆژی جلشوشتن دەردەکەوێت. ئەمە جیاوازییەکەیە.",
      } },
      { type: "h2", text: { en: "One: let it be the loudest thing", ar: "أولاً: دعه يكون الأعلى صوتاً", ku: "یەکەم: با ئەو بەرزترین دەنگ بێت" } },
      { type: "p", text: {
        en: "A jersey is a statement piece. Everything else stays quiet — straight-leg trousers in stone or black, clean leather or suede, no competing graphics.",
        ar: "القميص قطعة تصريح. كل ما عداه يبقى هادئاً — بنطال مستقيم بالحجري أو الأسود، وجلد أو شامواه نظيف، وبلا رسومات منافسة.",
        ku: "کراس پارچەی ڕاگەیاندنە. هەموو شتێکی تر بێدەنگ دەمێنێتەوە — پانتۆڵی ڕاست بە بەردین یان ڕەش، چەرمی پاک، و هیچ گرافیکێکی ڕکابەر نییە.",
      } },
      { type: "h2", text: { en: "Two: layer like the nineties", ar: "ثانياً: طبّق كما في التسعينات", ku: "دووەم: چینبەندی وەک نەوەدەکان" } },
      { type: "p", text: {
        en: "Our 90's Jacket exists for exactly this — snap it open over the Iraq 40 Jersey and you have the warm-up-tunnel look that photographs never get old.",
        ar: "جاكيت التسعينات موجود لهذا بالضبط — افتحه فوق قميص العراق ٤٠ لتحصل على إطلالة نفق الإحماء التي لا تشيخ صورها أبداً.",
        ku: "چاکەتی نەوەدەکانمان بۆ ئەمە هەیە — بەسەر کراسی عێراق ٤٠دا بیکەوە و دیمەنی تونێلی گەرمکردنەوەت هەیە کە وێنەکانی هەرگیز کۆن نابن.",
      } },
      { type: "p", text: {
        en: "Three: size up. Four: never tuck it. Five — and this is the only rule that matters — wear it on matchday, win or lose.",
        ar: "ثالثاً: اختر مقاساً أكبر. رابعاً: لا تدخله في البنطال أبداً. خامساً — وهي القاعدة الوحيدة المهمة — البسه يوم المباراة، فوزاً أو خسارة.",
        ku: "سێیەم: قەبارەیەک گەورەتر ببە. چوارەم: هەرگیز مەیخە ناو پانتۆڵەوە. پێنجەم — و ئەمە تاکە یاسایە کە گرنگە — لە ڕۆژی یاریدا لەیبەرکە، بردنەوە یان دۆڕان.",
      } },
      { type: "image", image: {
        key: "brand/wordmark.png",
        alt: { en: "CAPITRES — Declare Your Passion", ar: "كابتريس — أعلن شغفك", ku: "کاپیترێس — عەشقەکەت ڕابگەیەنە" },
      } },
    ],
  },
];
