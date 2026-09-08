/** Commerce rules shared by the cart, checkout and policy pages. */

import type { Currency } from "@/lib/catalog/types";
import { convertFromIqd, IQD_PER_USD } from "@/lib/money";

/**
 * Gift cards are off for now — the feature stays fully built (catalog
 * plumbing, checkout redemption, admin management) so it's a one-line flip
 * back on later. Flipping this to true re-exposes /gift-cards, its nav
 * links, its product listing, and its sitemap entries — nothing else needs
 * to change.
 */
export const GIFT_CARDS_ENABLED = false;

/** "gift-cards" is special everywhere (denominations instead of sizes,
 * links to /gift-cards) — kept here (not in the server-only catalog/
 * categories module) so client components can reference it safely. */
export const GIFT_CARD_CATEGORY = "gift-cards";

export const FREE_SHIPPING_THRESHOLD = 100_000; // IQD — domestic only, see computeTotals
export const SHIPPING_RATE_IQ = 5_000; // IQD — domestic
/** International is a flat $30 regardless of order value or destination
 * country — converted to IQD since that's what Wayl actually settles. */
export const SHIPPING_RATE_INTL_USD = 30;
export const SHIPPING_RATE_INTL = Math.round(SHIPPING_RATE_INTL_USD * IQD_PER_USD);

function shippingRateFor(region: "IQ" | "INTL"): number {
  return region === "INTL" ? SHIPPING_RATE_INTL : SHIPPING_RATE_IQ;
}

export const GIFT_CARD_DENOMINATIONS = [25_000, 50_000, 100_000, 250_000];

/** Buy X (from a pool of products/categories) Get Y (from another pool) at
 * a % discount — see src/lib/commerce/bogo.ts's computeBogoDiscount() for
 * the actual allocation algorithm (checkout-only; there's no client-side
 * preview, see computeTotals/computeDisplayTotals below). Pools are a mix
 * of exact product slugs and/or whole category slugs. */
export interface BogoConfig {
  buyProductSlugs: string[];
  buyCategories: string[];
  getProductSlugs: string[];
  getCategories: string[];
  buyQty: number;
  getQty: number;
  /** 1–100; 100 = fully free. */
  getDiscountPercent: number;
}

/** Admin-managed via /admin/promo-codes (src/lib/admin/promo-codes.ts) —
 * resolved server-side by src/lib/promo-codes.ts's validatePromoCode(),
 * which also enforces the campaign date window, region, and max-uses limit
 * before a code ever reaches computeTotals()/computeDisplayTotals() below. */
export interface PromoCode {
  code: string;
  type: "percent" | "fixed" | "free-shipping" | "bogo";
  /** Percentage points for "percent"; a whole-IQD amount for "fixed".
   * Unused for "free-shipping"/"bogo". */
  value?: number;
  /** "fixed" only — admin-set explicit amounts in USD/EUR cents. Absent
   * for a currency means computeDisplayTotals falls back to
   * convertFromIqd(value, currency) instead, same override-else-fallback
   * pattern as priceByCurrencyOf() in
   * src/lib/catalog/providers/postgres.ts. */
  valueByCurrency?: { USD?: number; EUR?: number };
  /** Restricts the code to one shipping region; undefined/null = usable
   * from either. Orthogonal to `type`. */
  region?: "IQ" | "INTL" | null;
  /** "bogo" only. */
  bogo?: BogoConfig;
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  freeShipping: boolean;
}

export function computeTotals(
  subtotal: number,
  promo: PromoCode | undefined,
  options: {
    physicalItems: boolean;
    region?: "IQ" | "INTL";
    /** The BOGO discount amount, computed separately by
     * src/lib/commerce/bogo.ts's computeBogoDiscount() — checkout is the
     * only caller that ever passes this (it needs the full, server-priced
     * order lines, which this function doesn't have). Additive with the
     * percent/fixed formula below, though in practice only one of the two
     * is ever nonzero for a given promo since a code has exactly one type. */
    extraDiscount?: number;
  },
): Totals {
  const formulaDiscount =
    promo?.type === "percent"
      ? Math.round((subtotal * (promo.value ?? 0)) / 100)
      : promo?.type === "fixed"
        ? Math.min(subtotal, promo.value ?? 0)
        : 0;
  const discount = Math.min(subtotal, formulaDiscount + (options.extraDiscount ?? 0));
  const discounted = Math.max(0, subtotal - discount);
  const region = options.region ?? "IQ";
  const freeShipping =
    !options.physicalItems ||
    promo?.type === "free-shipping" ||
    // The order-value threshold is a domestic perk — international is
    // always the flat rate below, no matter how large the order is.
    (region === "IQ" && discounted >= FREE_SHIPPING_THRESHOLD);
  const shipping = freeShipping ? 0 : shippingRateFor(region);
  return {
    subtotal,
    discount,
    shipping,
    total: discounted + shipping,
    freeShipping,
  };
}

/**
 * Display-only equivalent of `totals` in another currency — never used for
 * anything actually charged (checkout always re-derives real IQD totals
 * via `computeTotals`). `displaySubtotal` should come from summing the
 * cart lines' own snapshotted per-currency prices (so it matches what was
 * shown on the product page), not a raw conversion of `totals.subtotal` —
 * but discount/shipping/free-shipping are IQD-threshold business rules, so
 * those reuse the *already-decided* outcome from `totals` (was a percent
 * discount applied? was shipping free?) rather than re-evaluating
 * thresholds against a foreign-currency number.
 */
export function computeDisplayTotals(
  totals: Totals,
  displaySubtotal: number,
  promo: PromoCode | undefined,
  currency: Currency,
  region?: "IQ" | "INTL",
): Totals {
  const discount =
    promo?.type === "percent"
      ? Math.round((displaySubtotal * (promo.value ?? 0)) / 100)
      : promo?.type === "fixed"
        ? Math.min(
            displaySubtotal,
            currency === "IQD"
              ? (promo.value ?? 0)
              : (promo.valueByCurrency?.[currency] ?? convertFromIqd(promo.value ?? 0, currency)),
          )
        : 0;
  const shipping = totals.freeShipping
    ? 0
    : convertFromIqd(shippingRateFor(region ?? "IQ"), currency);
  return {
    subtotal: displaySubtotal,
    discount,
    shipping,
    total: displaySubtotal - discount + shipping,
    freeShipping: totals.freeShipping,
  };
}
