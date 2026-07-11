/** Filter constants shared by the shop page (RSC) and its client UI. */

export const PRICE_RANGES: { id: string; min?: number; max?: number }[] = [
  { id: "under50", max: 50_000 },
  { id: "50to70", min: 50_000, max: 70_000 },
  { id: "over70", min: 70_000 },
];

export const FILTER_SIZES = ["S", "M", "L", "XL", "2XL"];

export const FILTER_CATEGORIES = [
  "all",
  "tees",
  "jerseys",
  "outerwear",
  "accessories",
] as const;
