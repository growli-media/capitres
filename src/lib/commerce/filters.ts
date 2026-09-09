/** Filter constants shared by the shop page (RSC) and its client UI. */

export const PRICE_RANGES: { id: string; min?: number; max?: number }[] = [
  { id: "under50", max: 50_000 },
  { id: "50to70", min: 50_000, max: 70_000 },
  { id: "over70", min: 70_000 },
];

export const FILTER_SIZES = ["S", "M", "L", "XL", "2XL"];

/** Canonical apparel size progression, smallest to largest — used to sort
 * a product's variants everywhere they're listed (storefront size picker,
 * admin sizes/stock table) instead of whatever order the database happens
 * to return them in (plain alphabetical sorts "2XL" before "L"). A size
 * outside this list (a custom/nonstandard label) sorts after every
 * recognized one, alphabetically among themselves — it still shows, just
 * at the end, so nothing existing ever silently disappears. */
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

export function compareSizes(a: string, b: string): number {
  const ai = SIZE_ORDER.indexOf(a);
  const bi = SIZE_ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

export const FILTER_CATEGORIES = [
  "all",
  "tees",
  "jerseys",
  "outerwear",
  "accessories",
] as const;
