/** Shared badge coloring — used by ProductCard.tsx (shop grid, collection
 * pages, and the homepage marquee, which all render the same component)
 * and ProductGallery.tsx (the PDP), so the two never drift apart. */
export type BadgeTone = "new" | "sale" | "soldOut" | "unisex";

export const BADGE_CLASSES: Record<BadgeTone, string> = {
  new: "bg-red-700 text-white",
  sale: "bg-red-700 text-white",
  soldOut: "bg-ink text-paper",
  unisex: "bg-paper text-ink border border-ink/15",
};
