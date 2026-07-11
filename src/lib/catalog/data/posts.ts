import type { Post } from "@/lib/catalog/types";

import imgIraq84 from "@/images/products/iraq-84.jpg";
import imgAmoBaba from "@/images/products/amo-baba.jpg";
import imgIraq40 from "@/images/products/iraq-40-jersey.jpg";
import imgWordmark from "@/images/brand/wordmark.png";

export const posts: Post[] = [
  {
    slug: "1984-los-angeles-the-dream-begins",
    title: {
      en: "1984, Los Angeles: The Dream Begins",
      ar: "١٩٨٤، لوس أنجلس: بداية الحلم",
      ku: "١٩٨٤، لۆس ئەنجلس: دەستپێکی خەونەکە",
    },
    excerpt: {
      en: "Why a single summer on Californian grass still shapes what we sew four decades later.",
      ar: "لماذا لا يزال صيف واحد على عشب كاليفورنيا يشكّل ما نخيطه بعد أربعة عقود.",
      ku: "بۆچی هاوینێک لەسەر چیمەنی کالیفۆرنیا هێشتا شێوەی ئەوە دەکات کە چوار دەیە دواتر دەیدوورین.",
    },
    cover: {
      src: imgIraq84,
      alt: {
        en: "Iraq 84 heritage tee",
        ar: "تيشيرت العراق ٨٤ التراثي",
        ku: "تیشێرتی میراتی عێراق ٨٤",
      },
    },
    date: "2026-06-12",
    readingMinutes: 4,
    author: "Capitres Editorial",
    relatedProductSlugs: ["iraq-84", "iraq-80s-heritage"],
    body: [
      {
        type: "p",
        text: {
          en: "Every brand has a founding image. Ours is a television set in a Baghdad living room in the summer of 1984, and eleven men in olive walking out under Californian sun.",
          ar: "لكل علامة صورة تأسيسية. صورتنا جهاز تلفزيون في صالة بغدادية صيف ١٩٨٤، وأحد عشر رجلاً بالزيتوني يخرجون تحت شمس كاليفورنيا.",
          ku: "هەموو براندێک وێنەیەکی دامەزراندنی هەیە. هی ئێمە تەلەفزیۆنێکە لە هۆڵێکی بەغدا لە هاوینی ١٩٨٤، و یازدە پیاو بە زەیتوونییەوە لەژێر خۆری کالیفۆرنیا دەردەچن.",
        },
      },
      {
        type: "p",
        text: {
          en: "The Los Angeles Olympics were not Iraq's first international stage, but they were the one that made the dream feel touchable. Qualification alone put a generation of kids in the street with a ball and a borrowed name on their back.",
          ar: "لم تكن أولمبياد لوس أنجلس أول محفل دولي للعراق، لكنها كانت المحطة التي جعلت الحلم ملموساً. التأهل وحده أنزل جيلاً كاملاً من الأطفال إلى الشارع بكرة واسم مستعار على الظهر.",
          ku: "ئۆڵۆمپیادی لۆس ئەنجلس یەکەم سەکۆی نێودەوڵەتی عێراق نەبوو، بەڵام ئەو وێستگەیە بوو کە خەونەکەی کردە شتێکی بەردەست. تەنیا دەرچوون بۆ ئۆڵۆمپیاد نەوەیەکی تەواوی منداڵانی خستە سەر شەقام بە تۆپێک و ناوێکی خوازراو لە پشتیان.",
        },
      },
      {
        type: "quote",
        text: {
          en: "Maroon and off-white — the elegant palette of a generation that wrote its name among the greats.",
          ar: "الماروني والأوف وايت — لوحة أنيقة لجيل خطّ اسمه بين الكبار.",
          ku: "مارۆنی و ئۆف وایت — ڕەنگە جوانەکانی نەوەیەک کە ناوی لەنێو گەورەکاندا نووسی.",
        },
        attribution: {
          en: "From the Iraq 84 design notes",
          ar: "من ملاحظات تصميم العراق ٨٤",
          ku: "لە تێبینییەکانی دیزاینی عێراق ٨٤",
        },
      },
      {
        type: "h2",
        text: {
          en: "From archive to garment",
          ar: "من الأرشيف إلى القطعة",
          ku: "لە ئەرشیفەوە بۆ پارچە",
        },
      },
      {
        type: "p",
        text: {
          en: "The Iraq 84 tee began with photographs — the collar line, the weight of the cloth, the exact distance between crest and heart. We matched the maroon by eye against three surviving prints, then let a 240gsm cotton carry the memory.",
          ar: "بدأ تيشيرت العراق ٨٤ من الصور — خط الياقة، ووزن القماش، والمسافة الدقيقة بين الشعار والقلب. طابقنا الماروني بالعين على ثلاث صور باقية، ثم تركنا قطناً بوزن ٢٤٠ غراماً يحمل الذاكرة.",
          ku: "تیشێرتی عێراق ٨٤ لە وێنەکانەوە دەستیپێکرد — هێڵی یەخە، کێشی قوماش، و دووری وردی نێوان نیشانە و دڵ. مارۆنییەکەمان بە چاو لەگەڵ سێ وێنەی ماوە بەراورد کرد، پاشان وامانلێکرد لۆکەیەکی ٢٤٠ گرامی یادگارییەکە هەڵبگرێت.",
        },
      },
      {
        type: "p",
        text: {
          en: "Heritage is not a costume. It has to survive the wash, the crowd and the years — like the memory it carries.",
          ar: "التراث ليس زيّاً تنكرياً. عليه أن يصمد أمام الغسيل والجمهور والسنين — مثل الذاكرة التي يحملها.",
          ku: "میرات جلی شانۆ نییە. دەبێت لە شوشتن و قەرەباڵغی و ساڵەکاندا بمێنێتەوە — وەک ئەو یادگارییەی هەڵیدەگرێت.",
        },
      },
    ],
  },
  {
    slug: "ammo-baba-father-of-iraqi-football",
    title: {
      en: "Ammo Baba, Father of Iraqi Football",
      ar: "عمو بابا، أبو الكرة العراقية",
      ku: "عەمۆ بابا، باوکی تۆپی پێی عێراق",
    },
    excerpt: {
      en: "Player, coach, institution. The story behind the portrait on our stone-grey tee.",
      ar: "لاعب ومدرب ومؤسسة. الحكاية خلف البورتريه على تيشيرتنا الرمادي.",
      ku: "یاریزان، ڕاهێنەر، دامەزراوە. چیرۆکی پشت پۆرترەیتەکەی سەر تیشێرتە خۆڵەمێشییەکەمان.",
    },
    cover: {
      src: imgAmoBaba,
      alt: {
        en: "Amo Baba tribute tee",
        ar: "تيشيرت عمو بابا",
        ku: "تیشێرتی عەمۆ بابا",
      },
    },
    date: "2026-06-28",
    readingMinutes: 5,
    author: "Capitres Editorial",
    relatedProductSlugs: ["amo-baba"],
    body: [
      {
        type: "p",
        text: {
          en: "Some men score goals. Some men win cups. A very few become the reason a country plays the game at all. Emmanuel Baba Dawud — Ammo Baba to every kid who ever kicked a ball in Iraq — was the third kind.",
          ar: "بعض الرجال يسجلون الأهداف. وبعضهم يرفعون الكؤوس. وقلّة نادرة يصبحون السبب في أن بلداً كاملاً يلعب اللعبة أصلاً. عمانوئيل بابا داود — عمو بابا لكل طفل ركل كرة في العراق — كان من النوع الثالث.",
          ku: "هەندێک پیاو گۆڵ تۆماردەکەن. هەندێکیان جام دەبەنەوە. کەمێکی دەگمەن دەبنە هۆکاری ئەوەی وڵاتێک بە تەواوی یارییەکە بکات. عیمانوێل بابا داود — عەمۆ بابا بۆ هەموو منداڵێک کە لە عێراقدا تۆپێکی لێداوە — لە جۆری سێیەم بوو.",
        },
      },
      {
        type: "p",
        text: {
          en: "As a striker he terrorised defences across the fifties and sixties. As a coach he took the national team to Gulf Cup after Gulf Cup and refused to let standards drop, even when everything around the game was falling apart.",
          ar: "كمهاجم أرعب الدفاعات طوال الخمسينات والستينات. وكمدرب قاد المنتخب من خليجي إلى خليجي ورفض أن تتراجع المعايير حتى حين كان كل شيء حول اللعبة يتداعى.",
          ku: "وەک هێرشبەر لە پەنجاکان و شەستەکاندا بەرگرییەکانی دەترساند. وەک ڕاهێنەر هەڵبژاردەی نیشتمانی لە جامی کەنداوێکەوە بۆ یەکێکی تر برد و ڕازی نەبوو ئاستەکان دابەزن، تەنانەت کاتێک هەموو شتێک لە دەوری یارییەکە هەڵدەوەشایەوە.",
        },
      },
      {
        type: "h2",
        text: {
          en: "The touchline silhouette",
          ar: "ظلّه على خط التماس",
          ku: "سێبەرەکەی سەر هێڵی یاری",
        },
      },
      {
        type: "p",
        text: {
          en: "Late in life he poured what he had into a football school for orphans, coaching from a chair when his legs gave out. That silhouette — tracksuit, whistle, absolute authority — is the one we drew for the tee.",
          ar: "في أواخر حياته وهب ما يملك لمدرسة كرة قدم للأيتام، يدرّب من كرسيّه حين خذلته قدماه. ذلك الظل — بدلة رياضية وصافرة وهيبة مطلقة — هو ما رسمناه على التيشيرت.",
          ku: "لە کۆتایی ژیانیدا ئەوەی هەیبوو دای بە قوتابخانەیەکی تۆپی پێ بۆ هەتیوان، لە کورسییەکەوە ڕاهێنانی دەکرد کاتێک قاچەکانی وازیان لێهێنا. ئەو سێبەرە — جلی وەرزشی، فیکە، و دەسەڵاتی ڕەها — ئەوەیە کە بۆ تیشێرتەکە کێشامان.",
        },
      },
      {
        type: "quote",
        text: {
          en: "Before the trophies, there was a man on the touchline demanding more.",
          ar: "قبل الكؤوس، كان هناك رجل على خط التماس يطالب بالمزيد.",
          ku: "پێش جامەکان، پیاوێک لەسەر هێڵی یاری داوای زیاتری دەکرد.",
        },
      },
      {
        type: "p",
        text: {
          en: "Wear it like he coached: shoulders back, no excuses.",
          ar: "البسها كما كان يدرّب: كتفان مرفوعان وبلا أعذار.",
          ku: "وەک ئەو ڕاهێنانی دەکرد لەیبەرکە: شان بەرز، بێ بیانوو.",
        },
      },
    ],
  },
  {
    slug: "how-to-wear-a-heritage-jersey",
    title: {
      en: "How to Wear a Heritage Jersey",
      ar: "كيف ترتدي قميصاً تراثياً",
      ku: "چۆن کراسێکی میراتی لەبەر بکەیت",
    },
    excerpt: {
      en: "Five rules for taking a football shirt from the stands to dinner — without looking like you got lost on the way.",
      ar: "خمس قواعد لأخذ قميص الكرة من المدرجات إلى العشاء — دون أن تبدو وكأنك ضللت الطريق.",
      ku: "پێنج یاسا بۆ بردنی کراسی تۆپی پێ لە تریبوونەکانەوە بۆ نانی ئێوارە — بەبێ ئەوەی وا دەربکەویت ڕێگات ون کردووە.",
    },
    cover: {
      src: imgIraq40,
      alt: {
        en: "Iraq 40 jersey styled flat",
        ar: "قميص العراق ٤٠",
        ku: "کراسی عێراق ٤٠",
      },
    },
    date: "2026-07-05",
    readingMinutes: 3,
    author: "Capitres Editorial",
    relatedProductSlugs: ["iraq-40-jersey", "90s-jacket"],
    body: [
      {
        type: "p",
        text: {
          en: "The football jersey stopped being sportswear years ago. Worn right, it reads as intentional as any designer knit. Worn wrong, it reads like laundry day. Here is the difference.",
          ar: "توقف قميص الكرة عن كونه ملابس رياضية منذ سنوات. إن لُبس صحيحاً بدا مقصوداً كأي قطعة مصمّمة. وإن لُبس خطأً بدا كيوم الغسيل. هذا هو الفرق.",
          ku: "کراسی تۆپی پێ ساڵانێکە لە جلی وەرزشی بوون وەستاوە. بە دروستی لەبەر بکرێت، وەک هەر چنینێکی دیزاینەر مەبەستدار دەردەکەوێت. بە هەڵە لەبەر بکرێت، وەک ڕۆژی جلشوشتن دەردەکەوێت. ئەمە جیاوازییەکەیە.",
        },
      },
      {
        type: "h2",
        text: {
          en: "One: let it be the loudest thing",
          ar: "أولاً: دعه يكون الأعلى صوتاً",
          ku: "یەکەم: با ئەو بەرزترین دەنگ بێت",
        },
      },
      {
        type: "p",
        text: {
          en: "A jersey is a statement piece. Everything else stays quiet — straight-leg trousers in stone or black, clean leather or suede, no competing graphics.",
          ar: "القميص قطعة تصريح. كل ما عداه يبقى هادئاً — بنطال مستقيم بالحجري أو الأسود، وجلد أو شامواه نظيف، وبلا رسومات منافسة.",
          ku: "کراس پارچەی ڕاگەیاندنە. هەموو شتێکی تر بێدەنگ دەمێنێتەوە — پانتۆڵی ڕاست بە بەردین یان ڕەش، چەرمی پاک، و هیچ گرافیکێکی ڕکابەر نییە.",
        },
      },
      {
        type: "h2",
        text: {
          en: "Two: layer like the nineties",
          ar: "ثانياً: طبّق كما في التسعينات",
          ku: "دووەم: چینبەندی وەک نەوەدەکان",
        },
      },
      {
        type: "p",
        text: {
          en: "Our 90's Jacket exists for exactly this — snap it open over the Iraq 40 Jersey and you have the warm-up-tunnel look that photographs never get old.",
          ar: "جاكيت التسعينات موجود لهذا بالضبط — افتحه فوق قميص العراق ٤٠ لتحصل على إطلالة نفق الإحماء التي لا تشيخ صورها أبداً.",
          ku: "چاکەتی نەوەدەکانمان بۆ ئەمە هەیە — بەسەر کراسی عێراق ٤٠دا بیکەوە و دیمەنی تونێلی گەرمکردنەوەت هەیە کە وێنەکانی هەرگیز کۆن نابن.",
        },
      },
      {
        type: "p",
        text: {
          en: "Three: size up. Four: never tuck it. Five — and this is the only rule that matters — wear it on matchday, win or lose.",
          ar: "ثالثاً: اختر مقاساً أكبر. رابعاً: لا تدخله في البنطال أبداً. خامساً — وهي القاعدة الوحيدة المهمة — البسه يوم المباراة، فوزاً أو خسارة.",
          ku: "سێیەم: قەبارەیەک گەورەتر ببە. چوارەم: هەرگیز مەیخە ناو پانتۆڵەوە. پێنجەم — و ئەمە تاکە یاسایە کە گرنگە — لە ڕۆژی یاریدا لەیبەرکە، بردنەوە یان دۆڕان.",
        },
      },
      {
        type: "image",
        image: {
          src: imgWordmark,
          alt: {
            en: "CAPITRES — Declare Your Passion",
            ar: "كابتريس — أعلن شغفك",
            ku: "کاپیترێس — عەشقەکەت ڕابگەیەنە",
          },
        },
      },
    ],
  },
];
