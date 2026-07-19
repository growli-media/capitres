/** Motivational lines shown on the admin dashboard — one picked at
 * random (weighted) on each load, to give whoever's running the store a
 * lift. Every quote is bilingual: Arabic original/translation, English
 * underneath, and who it's from. */
export interface Quote {
  arabic: string;
  text: string;
  author: string;
  /** Relative frequency; higher shows more often. Default 1. */
  weight?: number;
}

// Weighting: Iraqi poetry appears most often, then the wider Arab poets,
// then the world's voices — all still in the mix.
const IRAQI_WEIGHT = 3;
const ARAB_WEIGHT = 2;

export const MOTIVATION_QUOTES: Quote[] = [
  // ---- Iraqi poetry — al-Mutanabbi, born in Kufa, Iraq ----
  {
    arabic: "إذا غامَرتَ في شَرَفٍ مَرومٍ، فلا تَقنَعْ بما دونَ النُّجومِ",
    text: "If you set out for glory, do not settle for less than the stars.",
    author: "Al-Mutanabbi",
    weight: IRAQI_WEIGHT,
  },
  {
    arabic: "على قَدْرِ أهلِ العَزمِ تأتي العَزائمُ، وتأتي على قَدْرِ الكِرامِ المَكارمُ",
    text: "Resolutions come to the measure of the resolute, and honors to the measure of the honorable.",
    author: "Al-Mutanabbi",
    weight: IRAQI_WEIGHT,
  },
  {
    arabic: "وإذا كانَتِ النُّفوسُ كِباراً، تَعِبَتْ في مُرادِها الأجسامُ",
    text: "When souls are great, the body wearies in pursuit of their longing.",
    author: "Al-Mutanabbi",
    weight: IRAQI_WEIGHT,
  },
  {
    arabic: "الخَيلُ والليلُ والبَيداءُ تَعرِفُني، والسَّيفُ والرُّمحُ والقِرطاسُ والقَلَمُ",
    text: "The horses, the night, and the desert know me — and the sword, the spear, the parchment, and the pen.",
    author: "Al-Mutanabbi",
    weight: IRAQI_WEIGHT,
  },
  {
    arabic: "لا تَحسَبِ المَجدَ تَمراً أنتَ آكِلُهُ، لن تَبلُغَ المَجدَ حتى تَلعَقَ الصَّبِرا",
    text: "Do not think glory a date you simply eat — you will not reach it until you taste the bitter aloe.",
    author: "Al-Mutanabbi",
    weight: IRAQI_WEIGHT,
  },
  {
    arabic: "وإذا لم يَكُنْ مِنَ المَوتِ بُدٌّ، فمِنَ العَجزِ أن تَموتَ جَباناً",
    text: "If death must come, then it is weakness to die a coward.",
    author: "Al-Mutanabbi",
    weight: IRAQI_WEIGHT,
  },
  {
    arabic: "أُريدُ مِن زَمَني ذا أن يُبَلِّغَني، ما ليسَ يَبلُغُهُ مِن نفسِهِ الزَّمَنُ",
    text: "I ask of my age what the age itself could never attain.",
    author: "Al-Mutanabbi",
    weight: IRAQI_WEIGHT,
  },
  {
    arabic: "ولم أرَ في عُيوبِ الناسِ عَيباً، كنَقصِ القادِرينَ على التَّمامِ",
    text: "I have found no flaw in people like falling short when you are able to complete.",
    author: "Al-Mutanabbi",
    weight: IRAQI_WEIGHT,
  },

  // ---- The wider Arab poets ----
  {
    arabic: "إذا الشَّعبُ يوماً أرادَ الحياةَ، فلا بُدَّ أن يَستجيبَ القَدَرْ",
    text: "If the people one day will to live, then destiny must answer the call.",
    author: "Abu al-Qasim al-Shabbi",
    weight: ARAB_WEIGHT,
  },
  {
    arabic: "ومَن لا يُحِبُّ صُعودَ الجِبالِ، يَعِشْ أبدَ الدهرِ بينَ الحُفَرْ",
    text: "Whoever does not love to climb mountains will live forever among the pits.",
    author: "Abu al-Qasim al-Shabbi",
    weight: ARAB_WEIGHT,
  },
  {
    arabic: "وما نَيلُ المَطالِبِ بالتَّمنّي، ولكن تُؤخَذُ الدُّنيا غِلابا",
    text: "What you seek is not won by wishing; the world is taken by striving.",
    author: "Ahmad Shawqi",
    weight: ARAB_WEIGHT,
  },
  {
    arabic: "على هذهِ الأرضِ ما يَستحقُّ الحياة",
    text: "On this earth, there is what makes life worth living.",
    author: "Mahmoud Darwish",
    weight: ARAB_WEIGHT,
  },
  {
    arabic: "قالَ: السماءُ كئيبةٌ! وتَجَهَّما، قلتُ: ابتَسِمْ، يكفي التَّجَهُّمُ في السَّما",
    text: "He said, 'The sky is gloomy,' and frowned. I said, 'Smile — the gloom of the sky is enough.'",
    author: "Elia Abu Madi",
    weight: ARAB_WEIGHT,
  },
  {
    arabic: "العملُ هو الحبُّ وقد صارَ مَرئيّاً.",
    text: "Work is love made visible.",
    author: "Kahlil Gibran",
    weight: ARAB_WEIGHT,
  },

  // ---- Voices from around the world ----
  {
    arabic: "رحلةُ الألفِ ميلٍ تبدأُ بخطوةٍ واحدة.",
    text: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
  },
  {
    arabic: "اسقُطْ سبعَ مرّاتٍ، وانهَضْ ثمانيَ.",
    text: "Fall seven times, stand up eight.",
    author: "Japanese proverb",
  },
  {
    arabic: "قد تُواجهُ هزائمَ كثيرة، لكن يجبُ ألّا تُهزَم.",
    text: "You may encounter many defeats, but you must not be defeated.",
    author: "Maya Angelou",
  },
  {
    arabic: "ابقَ متعطِّشاً، ابقَ جسوراً.",
    text: "Stay hungry, stay foolish.",
    author: "Steve Jobs",
  },
  {
    arabic: "آمِنْ بأنّكَ تستطيع، تكنْ قد قطعتَ نصفَ الطريق.",
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    arabic: "لا تستسلِمْ أبداً — لا، لا، لا.",
    text: "Never give in — never, never, never.",
    author: "Winston Churchill",
  },
  {
    arabic: "التفاؤلُ هو الإيمانُ الذي يقودُ إلى الإنجاز.",
    text: "Optimism is the faith that leads to achievement.",
    author: "Helen Keller",
  },
  {
    arabic: "يبدو الأمرُ مستحيلاً دائماً إلى أن يتحقَّق.",
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    arabic: "سرُّ التقدُّمِ أن تبدأ.",
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    arabic: "النجاحُ حصيلةُ جهودٍ صغيرةٍ تتكرَّرُ يوماً بعد يوم.",
    text: "Success is the sum of small efforts repeated day after day.",
    author: "Robert Collier",
  },

  // ---- Our own lines ----
  {
    arabic: "كلُّ علامةٍ كبيرةٍ بدأت بطلبٍ واحد، وطلباتُك في الطريق.",
    text: "Every big brand started with a single order. Yours are on the way.",
    author: "Capitres",
  },
  {
    arabic: "النموُّ من خلال الإبداع.",
    text: "Growth through creativity.",
    author: "Growli Media",
  },
];

export function randomQuote(): Quote {
  const total = MOTIVATION_QUOTES.reduce((sum, q) => sum + (q.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const q of MOTIVATION_QUOTES) {
    r -= q.weight ?? 1;
    if (r < 0) return q;
  }
  return MOTIVATION_QUOTES[MOTIVATION_QUOTES.length - 1];
}
