/** Motivational lines shown on the admin dashboard — one picked at
 * random on each load, to give whoever's running the store a lift. */
export interface Quote {
  text: string;
  author: string;
  /** Optional original Arabic (shown above the English translation). */
  arabic?: string;
}

export const MOTIVATION_QUOTES: Quote[] = [
  // Iraqi poetry — al-Mutanabbi, born in Kufa, Iraq; the poet whose name
  // marks Baghdad's storied literary street. Verses on ambition and grit.
  {
    arabic: "إذا غامَرتَ في شَرَفٍ مَرومِ، فلا تَقنَعْ بما دونَ النُّجومِ",
    text: "If you set out for glory, do not settle for less than the stars.",
    author: "Al-Mutanabbi",
  },
  {
    arabic: "على قَدْرِ أهلِ العَزمِ تأتي العَزائمُ، وتأتي على قَدْرِ الكِرامِ المَكارمُ",
    text: "Resolutions come to the measure of the resolute, and honors to the measure of the honorable.",
    author: "Al-Mutanabbi",
  },
  {
    arabic: "وإذا كانَتِ النُّفوسُ كِباراً، تَعِبَتْ في مُرادِها الأجسامُ",
    text: "When souls are great, the body wearies in pursuit of their longing.",
    author: "Al-Mutanabbi",
  },
  {
    arabic: "الخَيلُ والليلُ والبَيداءُ تَعرِفُني، والسَّيفُ والرُّمحُ والقِرطاسُ والقَلَمُ",
    text: "The horses, the night, and the desert know me — and the sword, the spear, the parchment, and the pen.",
    author: "Al-Mutanabbi",
  },
  { text: "Every big brand started with a single order. Yours are on the way.", author: "Capitres" },
  { text: "Whether you think you can or you think you can't — you're right.", author: "Henry Ford" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
  { text: "Do what you do so well that they want to see it again and bring their friends.", author: "Walt Disney" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "A brand is what people say about you when you're not in the room.", author: "Jeff Bezos" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Growth through creativity.", author: "Growli Media" },
];

export function randomQuote(): Quote {
  return MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
}
