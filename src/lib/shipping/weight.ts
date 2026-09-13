/**
 * Package weight for a GES Express rate quote — a fixed business formula,
 * not real per-product weight (the catalog doesn't track that): 0.5kg for
 * the first physical item, +0.3kg for each additional one. Gift cards
 * never count — they don't ship.
 */
export function estimatePhysicalWeightKg(totalPhysicalQty: number): number {
  if (totalPhysicalQty <= 0) return 0;
  return 0.5 + 0.3 * (totalPhysicalQty - 1);
}
