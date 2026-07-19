/** Motivational lines shown on the admin dashboard — one picked at
 * random on each load, to give whoever's running the store a lift. */
export interface Quote {
  text: string;
  author: string;
}

export const MOTIVATION_QUOTES: Quote[] = [
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
