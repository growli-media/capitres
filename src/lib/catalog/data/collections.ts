import type { Collection } from "@/lib/catalog/types";

import imgIraq84 from "@/images/products/iraq-84.jpg";
import imgIraq40 from "@/images/products/iraq-40-jersey.jpg";
import imgAmoBaba from "@/images/products/amo-baba.jpg";
import imgWordmark from "@/images/brand/wordmark.png";

export const collections: Collection[] = [
  {
    slug: "heritage-capsule",
    title: {
      en: "Heritage Capsule",
      ar: "كبسولة التراث",
      ku: "کۆلێکشنی میرات",
    },
    tagline: {
      en: "1984. Los Angeles. The dream begins.",
      ar: "١٩٨٤. لوس أنجلس. بداية الحلم.",
      ku: "١٩٨٤. لۆس ئەنجلس. دەستپێکی خەونەکە.",
    },
    description: {
      en: "The kits that made a nation believe, rebuilt from the archive — Olympic olive, floodlit nights and the decade football never gave back.",
      ar: "الأطقم التي جعلت أمة كاملة تؤمن، أُعيد بناؤها من الأرشيف — زيتوني الأولمبياد، وليالي الأضواء الكاشفة، والعقد الذي لم تُعده الكرة أبداً.",
      ku: "ئەو جلانەی نەتەوەیەکیان هێنایە باوەڕ، لە ئەرشیفەوە دروستکراونەتەوە — زەیتوونی ئۆڵۆمپیاد، شەوانی پرۆژەکتەر، و ئەو دەیەیەی تۆپی پێ هەرگیز نەیگەڕاندەوە.",
    },
    heroImage: {
      src: imgIraq84,
      alt: {
        en: "Iraq 84 heritage tee on studio backdrop",
        ar: "تيشيرت العراق ٨٤ التراثي على خلفية استوديو",
        ku: "تیشێرتی میراتی عێراق ٨٤ لەسەر باکگراوندی ستۆدیۆ",
      },
    },
    theme: "dark",
    order: 1,
  },
  {
    slug: "matchday",
    title: { en: "Matchday", ar: "يوم المباراة", ku: "ڕۆژی یاری" },
    tagline: {
      en: "Ninety minutes, worn all week.",
      ar: "تسعون دقيقة تُلبس طوال الأسبوع.",
      ku: "نەوەد خولەک، هەموو هەفتە لەبەرکراو.",
    },
    description: {
      en: "Jerseys and warm-ups cut for the walk to the stadium — technical knits, archive details, nothing you have to take off on Monday.",
      ar: "قمصان وجاكيتات إحماء بقصّات لمشوار الملعب — أنسجة تقنية وتفاصيل أرشيفية، ولا شيء تضطر لخلعه يوم الاثنين.",
      ku: "کراس و چاکەتی گەرمکردنەوە بۆ ڕێگای یاریگا — چنینی تەکنیکی، وردەکاری ئەرشیفی، هیچ شتێک نییە کە ڕۆژی دووشەممە دایبکەنیت.",
    },
    heroImage: {
      src: imgIraq40,
      alt: {
        en: "Iraq 40 jersey in desert taupe",
        ar: "قميص العراق ٤٠ بالترابي الصحراوي",
        ku: "کراسی عێراق ٤٠ بە خۆڵەمێشی بیابانی",
      },
    },
    theme: "light",
    order: 2,
  },
  {
    slug: "essentials",
    title: { en: "Essentials", ar: "الأساسيات", ku: "بنەڕەتییەکان" },
    tagline: {
      en: "The everyday squad.",
      ar: "تشكيلة كل يوم.",
      ku: "تیمەکەی هەموو ڕۆژێک.",
    },
    description: {
      en: "Heavyweight staples in studio tones — the pieces you reach for without thinking, with a story stitched in anyway.",
      ar: "قطع أساسية ثقيلة بألوان الاستوديو — القطع التي تمد يدك إليها بلا تفكير، وفيها حكاية مخيطة على أي حال.",
      ku: "پارچە بنەڕەتییە قورسەکان بە ڕەنگی ستۆدیۆ — ئەو پارچانەی بێ بیرکردنەوە بۆیان دەچیت، و لەگەڵ ئەوەشدا چیرۆکێکیان تێدا دوورماوە.",
    },
    heroImage: {
      src: imgAmoBaba,
      alt: {
        en: "Amo Baba tee in stone grey",
        ar: "تيشيرت عمو بابا بالرمادي الحجري",
        ku: "تیشێرتی عەمۆ بابا بە خۆڵەمێشی بەردین",
      },
    },
    theme: "light",
    order: 3,
  },
  {
    slug: "soughe-x-capitres",
    title: {
      en: "SOUGHE × CAPITRES",
      ar: "سوغة × كابتريس",
      ku: "سوغە × کاپیترێس",
    },
    tagline: {
      en: "Support Iraq — together.",
      ar: "شجع العراق — سوية.",
      ku: "پشتگیری عێراق بکە — پێکەوە.",
    },
    description: {
      en: "Our first collaboration — a giveaway drop with SOUGHE celebrating the supporters. Sold through in days; archived here for the record.",
      ar: "أول تعاون لنا — إصدار مع سوغة احتفاءً بالجمهور. نفد خلال أيام؛ مؤرشف هنا للتوثيق.",
      ku: "یەکەم هاوکاریمان — بڵاوکردنەوەیەک لەگەڵ سوغە بۆ ئاهەنگگێڕان بە هاندەران. لە چەند ڕۆژێکدا فرۆشرا؛ لێرە بۆ تۆمار ئەرشیفکراوە.",
    },
    heroImage: {
      src: imgWordmark,
      alt: {
        en: "CAPITRES wordmark — Declare Your Passion",
        ar: "شعار كابتريس — أعلن شغفك",
        ku: "نیشانەی کاپیترێس — عەشقەکەت ڕابگەیەنە",
      },
    },
    theme: "dark",
    archived: true,
    order: 4,
  },
];
