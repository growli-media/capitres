import type { Product } from "@/lib/catalog/types";

import imgIraq84 from "@/images/products/iraq-84.jpg";
import imgIraq40 from "@/images/products/iraq-40-jersey.jpg";
import imgIraq88 from "@/images/products/iraq-88.jpg";
import img90sJacket from "@/images/products/90s-jacket.jpg";
import imgAmoBaba from "@/images/products/amo-baba.jpg";
import imgIraq70 from "@/images/products/iraq-70.jpg";
import imgHeritage from "@/images/products/iraq-80s-heritage.jpg";
import imgWordmark from "@/images/brand/wordmark.png";

/**
 * Catalog source of truth (local provider).
 *
 * Product imagery, names and prices are traced from capitres.com.
 * The Arabic story for "Iraq 84" is verbatim from the live storefront;
 * remaining copy was written in the same voice — see TODO-ASSETS.md.
 * Inventory counts are placeholders pending real stock data.
 */

const sizesTee = ["S", "M", "L", "XL", "2XL"];
const sizesJersey = ["M", "L", "XL", "2XL"];

function variants(
  slug: string,
  sizes: string[],
  stock: Record<string, number> | number,
) {
  return sizes.map((size) => ({
    id: `${slug}-${size}`,
    size,
    stock: typeof stock === "number" ? stock : (stock[size] ?? 0),
  }));
}

export const products: Product[] = [
  {
    id: "p-iraq-84",
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
      {
        en: "240 gsm heavyweight combed cotton",
        ar: "قطن ممشط ثقيل ٢٤٠ غم/م²",
        ku: "لۆکەی شانەکراوی قورس ٢٤٠ گم/م²",
      },
      {
        en: "Boxy heritage fit with dropped shoulder",
        ar: "قصّة تراثية واسعة بكتف نازل",
        ku: "بڕینی میراتی بەرفراوان بە شانی شۆڕ",
      },
      {
        en: "Archive-referenced chest print",
        ar: "طبعة صدر مستندة إلى الأرشيف",
        ku: "چاپی سنگ لە ئەرشیفەوە وەرگیراو",
      },
      {
        en: "Cold wash, inside out. Do not tumble dry.",
        ar: "غسيل بارد مقلوباً. لا يُجفف بالمجفف.",
        ku: "بە ئاوی سارد و پێچەوانە بیشۆ. وشککەرەوە بەکارمەهێنە.",
      },
    ],
    category: "tees",
    gender: "unisex",
    price: { amount: 65_000, currency: "IQD" },
    colors: [
      {
        key: "off-white",
        hex: "#F5F4F6",
        name: { en: "Off-White / Maroon", ar: "أوف وايت / ماروني", ku: "ئۆف وایت / مارۆنی" },
      },
    ],
    variants: variants("iraq-84", sizesTee, { S: 4, M: 8, L: 10, XL: 6, "2XL": 3 }),
    images: [
      {
        src: imgIraq84,
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
      {
        id: "r-84-1",
        author: "Mustafa K.",
        rating: 5,
        date: "2026-06-02",
        text: "القماش ثقيل والطبعة نظيفة جداً. لبسته يوم مباراة المنتخب وكل الناس سألتني منين اشتريته.",
      },
      {
        id: "r-84-2",
        author: "Sara A.",
        rating: 5,
        date: "2026-06-18",
        text: "Bought it for my dad who watched the '84 squad live. He didn't take it off for a week.",
      },
      {
        id: "r-84-3",
        author: "هێمن",
        rating: 4,
        date: "2026-06-25",
        text: "قوماشەکەی زۆر باشە و قەبارەکەی وەک خۆیەتی. تەنیا گەیاندنەکە دوو ڕۆژ دواکەوت.",
      },
    ],
  },
  {
    id: "p-iraq-40",
    slug: "iraq-40-jersey",
    title: {
      en: "Iraq 40 Jersey",
      ar: "قميص العراق ٤٠",
      ku: "کراسی عێراق ٤٠",
    },
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
      {
        en: "Breathable jacquard knit, 165 gsm",
        ar: "نسيج جاكار يتنفس، ١٦٥ غم/م²",
        ku: "چنینی جاکاردی هەناسەدار، ١٦٥ گم/م²",
      },
      {
        en: "Embroidered crest, numbered hem tag",
        ar: "شعار مطرز وبطاقة حاشية مرقمة",
        ku: "نیشانەی دورماوکراو و تاگی ژمارەدار",
      },
      {
        en: "Athletic fit — size up for a terrace fit",
        ar: "قصّة رياضية — اختر مقاساً أكبر لإطلالة المدرجات",
        ku: "بڕینی وەرزشی — بۆ ستایلی تریبوون قەبارەیەک گەورەتر ببە",
      },
    ],
    category: "jerseys",
    gender: "unisex",
    price: { amount: 75_000, currency: "IQD" },
    colors: [
      {
        key: "desert-taupe",
        hex: "#736158",
        name: { en: "Desert Taupe", ar: "ترابي صحراوي", ku: "خۆڵەمێشی بیابانی" },
      },
    ],
    variants: variants("iraq-40-jersey", sizesJersey, { M: 7, L: 9, XL: 5, "2XL": 2 }),
    images: [
      {
        src: imgIraq40,
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
      {
        id: "r-40-1",
        author: "Ali H.",
        rating: 5,
        date: "2026-06-28",
        text: "Quality is on another level compared to the bootleg jerseys in the market. The hem tag detail is class.",
      },
      {
        id: "r-40-2",
        author: "نور",
        rating: 4,
        date: "2026-07-01",
        text: "القماش خفيف ومريح بس تمنيت لو أكو ألوان ثانية. المقاس مضبوط.",
      },
    ],
  },
  {
    id: "p-iraq-88",
    slug: "iraq-88",
    title: { en: "Iraq 88 Tee", ar: "تيشيرت العراق ٨٨", ku: "تیشێرتی عێراق ٨٨" },
    description: {
      en: "Ink-black heavyweight tee marking 1988 — a year of defiance played out under floodlights. Minimal front, archive print across the back.",
      ar: "تيشيرت أسود ثقيل يوثّق عام ١٩٨٨ — عام من التحدي تحت الأضواء الكاشفة. واجهة بسيطة وطبعة أرشيفية على الظهر.",
      ku: "تیشێرتی ڕەشی قورس بۆ ساڵی ١٩٨٨ — ساڵێکی بەرەنگاری لەژێر پرۆژەکتەرەکاندا. پێشەوەیەکی سادە و چاپێکی ئەرشیفی لە پشتەوە.",
    },
    details: [
      {
        en: "240 gsm heavyweight combed cotton",
        ar: "قطن ممشط ثقيل ٢٤٠ غم/م²",
        ku: "لۆکەی شانەکراوی قورس ٢٤٠ گم/م²",
      },
      {
        en: "Back archive print, tonal neck tape",
        ar: "طبعة أرشيفية على الظهر وشريط رقبة متناغم",
        ku: "چاپی ئەرشیفی لە پشت و شریتی ملی هاوڕەنگ",
      },
    ],
    category: "tees",
    gender: "unisex",
    price: { amount: 65_000, currency: "IQD" },
    colors: [
      {
        key: "ink",
        hex: "#2B2A27",
        name: { en: "Ink", ar: "أسود حبري", ku: "ڕەشی مەرەکەبی" },
      },
    ],
    variants: variants("iraq-88", sizesTee, 0),
    images: [
      {
        src: imgIraq88,
        alt: {
          en: "Iraq 88 tee in ink black",
          ar: "تيشيرت العراق ٨٨ بالأسود الحبري",
          ku: "تیشێرتی عێراق ٨٨ بە ڕەشی مەرەکەبی",
        },
      },
    ],
    collectionSlugs: ["heritage-capsule"],
    releaseDate: "2026-04-02",
    reviews: [
      {
        id: "r-88-1",
        author: "Dler M.",
        rating: 5,
        date: "2026-05-11",
        text: "Sold out twice for a reason. Print quality survived a whole season of washes.",
      },
    ],
  },
  {
    id: "p-90s-jacket",
    slug: "90s-jacket",
    title: { en: "90's Jacket", ar: "جاكيت التسعينات", ku: "چاکەتی نەوەدەکان" },
    description: {
      en: "A warm-up jacket cut from the VHS era — black shell, cream panelling, snap front. The kind of jacket the kit man never got back.",
      ar: "جاكيت إحماء بقصّة من زمن أشرطة الفيديو — جسم أسود، وقطع كريمية، وأزرار كبس أمامية. من النوع الذي لا يعود إلى مسؤول العهدة أبداً.",
      ku: "چاکەتی گەرمکردنەوە بە بڕینی سەردەمی VHS — لاشەی ڕەش، پارچەی کرێمی، و دوگمەی تەقە. لەو چاکەتانەی کە هەرگیز ناگەڕێنەوە لای بەرپرسی جلەکان.",
    },
    details: [
      {
        en: "Water-resistant nylon shell, brushed lining",
        ar: "نايلون مقاوم للماء وبطانة ناعمة",
        ku: "نایلۆنی دژە ئاو و ناوپۆشی نەرم",
      },
      {
        en: "Snap front, elastic cuffs, twin welt pockets",
        ar: "أزرار كبس، وأساور مطاطية، وجيبان جانبيان",
        ku: "دوگمەی تەقە، مەچەکی لاستیکی، دوو گیرفانی لاتەنیشت",
      },
    ],
    category: "outerwear",
    gender: "unisex",
    price: { amount: 65_000, currency: "IQD" },
    colors: [
      {
        key: "black-cream",
        hex: "#1A1315",
        name: { en: "Black / Cream", ar: "أسود / كريمي", ku: "ڕەش / کرێمی" },
      },
    ],
    variants: variants("90s-jacket", sizesJersey, { M: 5, L: 6, XL: 4, "2XL": 2 }),
    images: [
      {
        src: img90sJacket,
        alt: {
          en: "90's warm-up jacket in black with cream panels",
          ar: "جاكيت إحماء التسعينات بالأسود مع قطع كريمية",
          ku: "چاکەتی گەرمکردنەوەی نەوەدەکان بە ڕەش و پارچەی کرێمی",
        },
      },
    ],
    collectionSlugs: ["matchday"],
    isNew: true,
    releaseDate: "2026-06-05",
    reviews: [
      {
        id: "r-90-1",
        author: "Zainab R.",
        rating: 5,
        date: "2026-06-21",
        text: "احلى جاكيت اشتريته هالسنة. القصة والخامة تحسها من التسعينات فعلاً.",
      },
    ],
  },
  {
    id: "p-amo-baba",
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
      {
        en: "220 gsm cotton, relaxed fit",
        ar: "قطن ٢٢٠ غم/م² بقصّة مريحة",
        ku: "لۆکەی ٢٢٠ گم/م²، بڕینی ئاسوودە",
      },
      {
        en: "Archive portrait print",
        ar: "طبعة بورتريه أرشيفية",
        ku: "چاپی پۆرترەیتی ئەرشیفی",
      },
    ],
    category: "tees",
    gender: "unisex",
    price: { amount: 50_000, currency: "IQD" },
    colors: [
      {
        key: "stone",
        hex: "#9B9191",
        name: { en: "Stone", ar: "رمادي حجري", ku: "خۆڵەمێشی بەردین" },
      },
    ],
    variants: variants("amo-baba", sizesTee, { S: 6, M: 9, L: 8, XL: 5, "2XL": 4 }),
    images: [
      {
        src: imgAmoBaba,
        alt: {
          en: "Amo Baba tribute tee in stone grey",
          ar: "تيشيرت عمو بابا بالرمادي الحجري",
          ku: "تیشێرتی عەمۆ بابا بە خۆڵەمێشی بەردین",
        },
      },
    ],
    collectionSlugs: ["essentials"],
    isNew: true,
    featured: true,
    releaseDate: "2026-06-28",
    reviews: [
      {
        id: "r-ab-1",
        author: "Omar T.",
        rating: 5,
        date: "2026-07-03",
        text: "جدي كان يحچيلي عن عمو بابا من كنت صغير. لبستها وأخذتله صورة — بكى الرجال.",
      },
      {
        id: "r-ab-2",
        author: "Lana S.",
        rating: 5,
        date: "2026-07-06",
        text: "The portrait print is beautiful and respectful. Fits true to size.",
      },
    ],
  },
  {
    id: "p-iraq-70",
    slug: "iraq-70",
    title: { en: "IRAQ 70 Tee", ar: "تيشيرت العراق ٧٠", ku: "تیشێرتی عێراق ٧٠" },
    description: {
      en: "Terracotta and sand — the palette of 1970s football photography. A sun-faded tribute to the pioneers who built the foundations.",
      ar: "تيراكوتا ورملي — ألوان صور كرة السبعينات. تحية بلون الشمس الباهتة للروّاد الذين وضعوا الأساس.",
      ku: "تیراکۆتا و لمی — ڕەنگەکانی وێنەگری تۆپی پێی حەفتاکان. ڕێزلێنانێکی خۆرهەڵهاتوو بۆ پێشەنگەکان کە بناغەکەیان داڕشت.",
    },
    details: [
      {
        en: "Garment-dyed 230 gsm cotton",
        ar: "قطن مصبوغ بعد الحياكة ٢٣٠ غم/م²",
        ku: "لۆکەی ٢٣٠ گم/م² دوای دورمان ڕەنگکراو",
      },
      {
        en: "Faded retro front print",
        ar: "طبعة أمامية ريترو باهتة",
        ku: "چاپی پێشەوەی ڕێترۆی کاڵبووەوە",
      },
    ],
    category: "tees",
    gender: "unisex",
    price: { amount: 55_000, currency: "IQD" },
    colors: [
      {
        key: "terracotta",
        hex: "#926149",
        name: { en: "Terracotta", ar: "تيراكوتا", ku: "تیراکۆتا" },
      },
    ],
    variants: variants("iraq-70", sizesTee, 0),
    images: [
      {
        src: imgIraq70,
        alt: {
          en: "IRAQ 70 tee in sun-faded terracotta",
          ar: "تيشيرت العراق ٧٠ بلون التيراكوتا الباهت",
          ku: "تیشێرتی عێراق ٧٠ بە تیراکۆتای کاڵبووەوە",
        },
      },
    ],
    collectionSlugs: ["heritage-capsule"],
    releaseDate: "2026-03-10",
    reviews: [],
  },
  {
    id: "p-iraq-80s-heritage",
    slug: "iraq-80s-heritage",
    title: {
      en: "Iraq 80's Heritage Tee",
      ar: "تيشيرت تراث الثمانينات",
      ku: "تیشێرتی میراتی هەشتاکان",
    },
    description: {
      en: "Pitch-green chest hit on studio white — the loudest quiet tee in the capsule. An everyday flag for the golden decade.",
      ar: "أخضر الملعب على أبيض الاستوديو — أهدأ تيشيرت وأعلاه صوتاً في الكبسولة. راية يومية للعقد الذهبي.",
      ku: "سەوزی یاریگا لەسەر سپی ستۆدیۆ — بێدەنگترین و بەرزترین تیشێرتی کۆلێکشنەکە. ئاڵایەکی ڕۆژانە بۆ دەیە زێڕینەکە.",
    },
    details: [
      {
        en: "220 gsm cotton, regular fit",
        ar: "قطن ٢٢٠ غم/م² بقصّة عادية",
        ku: "لۆکەی ٢٢٠ گم/م²، بڕینی ئاسایی",
      },
      {
        en: "High-density pitch-green print",
        ar: "طبعة خضراء عالية الكثافة",
        ku: "چاپی سەوزی چڕی بەرز",
      },
    ],
    category: "tees",
    gender: "unisex",
    price: { amount: 39_000, currency: "IQD" },
    compareAtPrice: { amount: 55_000, currency: "IQD" },
    colors: [
      {
        key: "pitch-green",
        hex: "#065E37",
        name: { en: "Pitch Green", ar: "أخضر الملعب", ku: "سەوزی یاریگا" },
      },
    ],
    variants: variants("iraq-80s-heritage", sizesTee, { S: 2, M: 5, L: 7, XL: 3, "2XL": 1 }),
    images: [
      {
        src: imgHeritage,
        alt: {
          en: "Iraq 80's heritage tee — white with pitch-green print",
          ar: "تيشيرت تراث الثمانينات — أبيض بطبعة خضراء",
          ku: "تیشێرتی میراتی هەشتاکان — سپی بە چاپی سەوز",
        },
      },
    ],
    collectionSlugs: ["heritage-capsule", "essentials"],
    releaseDate: "2026-02-01",
    reviews: [
      {
        id: "r-h-1",
        author: "Yousif B.",
        rating: 4,
        date: "2026-03-15",
        text: "Great daily tee. The green print is exactly the national team green.",
      },
    ],
  },
  {
    id: "p-gift-card",
    slug: "gift-card",
    title: {
      en: "Capitres Gift Card",
      ar: "بطاقة هدايا كابتريس",
      ku: "کارتی دیاری کاپیترێس",
    },
    description: {
      en: "For the one who never stopped believing. Delivered by email with your message, redeemable on everything, valid 24 months.",
      ar: "لمن لم يتوقف يوماً عن الإيمان. تُرسل بالبريد الإلكتروني مع رسالتك، وتُستخدم على كل شيء، وصالحة ٢٤ شهراً.",
      ku: "بۆ ئەو کەسەی هەرگیز لە باوەڕ نەوەستا. بە ئیمەیڵ لەگەڵ پەیامەکەت دەگەیەنرێت، بۆ هەموو شتێک بەکاردێت، ٢٤ مانگ کاردەکات.",
    },
    details: [
      {
        en: "Digital delivery by email",
        ar: "تسليم رقمي عبر البريد الإلكتروني",
        ku: "گەیاندنی دیجیتاڵ بە ئیمەیڵ",
      },
      {
        en: "Redeemable at checkout on any product",
        ar: "تُستخدم عند إتمام الطلب على أي منتج",
        ku: "لە کاتی کڕیندا بۆ هەر بەرهەمێک بەکاردێت",
      },
    ],
    category: "gift-cards",
    gender: "unisex",
    price: { amount: 25_000, currency: "IQD" },
    colors: [],
    variants: [{ id: "gift-card-digital", size: "DIGITAL", stock: 9999 }],
    images: [
      {
        src: imgWordmark,
        alt: {
          en: "Capitres gift card with the brand wordmark",
          ar: "بطاقة هدايا كابتريس بشعار العلامة",
          ku: "کارتی دیاری کاپیترێس بە نیشانەی براند",
        },
      },
    ],
    collectionSlugs: [],
    releaseDate: "2026-01-01",
    reviews: [],
    giftCard: {
      denominations: [25_000, 50_000, 100_000, 250_000],
    },
  },
];
