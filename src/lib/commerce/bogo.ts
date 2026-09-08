/** Buy-X-Get-Y discount calculation — checkout-only (see BogoConfig in
 * config.ts for why there's no client-side preview). Pure, no imports from
 * config.ts to avoid a cycle; BogoConfig is duck-typed here structurally. */

export interface BogoLine {
  productSlug: string;
  category: string;
  qty: number;
  /** IQD, already server-re-priced from the catalog. */
  unitAmount: number;
}

interface BogoPools {
  buyProductSlugs: string[];
  buyCategories: string[];
  getProductSlugs: string[];
  getCategories: string[];
  buyQty: number;
  getQty: number;
  getDiscountPercent: number;
}

interface Unit {
  unitAmount: number;
  isBuyEligible: boolean;
  isGetEligible: boolean;
}

/**
 * Computes the IQD discount for a "buy X get Y" promo against a cart's
 * server-priced lines, cheapest-eligible-unit-first (per the confirmed
 * design: the reward is always whichever eligible unit is cheapest, never
 * customer- or admin-picked at checkout time).
 *
 * Cart sizes here are small (qty is already capped at 20/line, few lines
 * per order) — expanding every line into individual priced "units" keeps
 * the allocation obviously correct, rather than doing count-only
 * bin-packing math that's easy to get subtly wrong.
 *
 * The one real subtlety: a product can legally sit in *both* the buy pool
 * and the get pool (the classic "buy 2 tees get 1 tee free", same category
 * both sides) — a single physical unit must never be double-counted as
 * both the thing that satisfies the buy requirement *and* the free reward.
 * See the step-by-step comments below for how that's kept correct.
 */
export function computeBogoDiscount(lines: BogoLine[], bogo: BogoPools): number {
  const buySlugs = new Set(bogo.buyProductSlugs);
  const buyCats = new Set(bogo.buyCategories);
  const getSlugs = new Set(bogo.getProductSlugs);
  const getCats = new Set(bogo.getCategories);

  // Step 1: expand every line into individual priced units.
  const units: Unit[] = [];
  for (const line of lines) {
    const isBuyEligible = buySlugs.has(line.productSlug) || buyCats.has(line.category);
    const isGetEligible = getSlugs.has(line.productSlug) || getCats.has(line.category);
    if (!isBuyEligible && !isGetEligible) continue;
    for (let i = 0; i < line.qty; i++) {
      units.push({ unitAmount: line.unitAmount, isBuyEligible, isGetEligible });
    }
  }

  // Step 2: partition into buy-only (B), get-only (G), and overlap (O) —
  // overlap units can flex to either role, but only once each.
  const buyOnly = units.filter((u) => u.isBuyEligible && !u.isGetEligible);
  const getOnly = units.filter((u) => u.isGetEligible && !u.isBuyEligible);
  const overlap = units.filter((u) => u.isBuyEligible && u.isGetEligible);
  const B = buyOnly.length;
  const G = getOnly.length;
  const O = overlap.length;

  const buyQty = Math.max(1, bogo.buyQty);
  const getQty = Math.max(1, bogo.getQty);

  // Step 3: find the largest reward-multiple k that's actually
  // satisfiable. This single formula collapses to "capped by both trigger
  // count and reward inventory" when pools are disjoint (O=0), and to
  // "every Nth unit free" when they fully overlap (B=G=0).
  const feasible = (k: number) => {
    const needBuyFromOverlap = Math.max(0, buyQty * k - B);
    const needGetFromOverlap = Math.max(0, getQty * k - G);
    return needBuyFromOverlap + needGetFromOverlap <= O;
  };
  let k = 0;
  while (feasible(k + 1)) k += 1;
  if (k === 0) return 0;

  // Step 4: decide which units are the actual reward, cheapest-first.
  // Among the overlap units, reserve the *most expensive* ones to satisfy
  // whatever buy requirement isn't already covered by buy-only units —
  // that leaves the *cheapest* overlap units free to compete as reward
  // candidates. Reversing this (reserving cheap units for "buy") would let
  // more expensive units end up as the "free" one, contradicting the
  // cheapest-first rule.
  const needBuyFromOverlap = Math.max(0, buyQty * k - B);
  const overlapSortedDesc = [...overlap].sort((a, b) => b.unitAmount - a.unitAmount);
  const overlapAvailableForReward = overlapSortedDesc.slice(needBuyFromOverlap);

  const rewardUnitsNeeded = getQty * k;
  const rewardCandidates = [...getOnly, ...overlapAvailableForReward].sort(
    (a, b) => a.unitAmount - b.unitAmount,
  );
  const rewardUnits = rewardCandidates.slice(0, rewardUnitsNeeded);

  // Step 5: price it — one rounding at the end, matching the existing
  // "percent" type's own single-Math.round convention.
  const discountPercent = Math.min(100, Math.max(1, bogo.getDiscountPercent));
  const rawDiscount = rewardUnits.reduce(
    (sum, u) => sum + (u.unitAmount * discountPercent) / 100,
    0,
  );
  return Math.round(rawDiscount);
}
