/** Commerce rules shared by the cart, checkout and policy pages. */

export const FREE_SHIPPING_THRESHOLD = 100_000; // IQD
export const FLAT_SHIPPING_RATE = 5_000; // IQD

export const GIFT_CARD_DENOMINATIONS = [25_000, 50_000, 100_000, 250_000];

export interface PromoCode {
  code: string;
  type: "percent" | "free-shipping";
  /** Percentage points for "percent" type. */
  value?: number;
}

export const PROMO_CODES: PromoCode[] = [
  { code: "CAPITRES10", type: "percent", value: 10 },
  { code: "SHUKRAN", type: "free-shipping" },
];

export function findPromo(code: string): PromoCode | undefined {
  const normalized = code.trim().toUpperCase();
  return PROMO_CODES.find((p) => p.code === normalized);
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
  options: { physicalItems: boolean },
): Totals {
  const discount =
    promo?.type === "percent"
      ? Math.round((subtotal * (promo.value ?? 0)) / 100)
      : 0;
  const discounted = Math.max(0, subtotal - discount);
  const freeShipping =
    !options.physicalItems ||
    discounted >= FREE_SHIPPING_THRESHOLD ||
    promo?.type === "free-shipping";
  const shipping = freeShipping ? 0 : FLAT_SHIPPING_RATE;
  return {
    subtotal,
    discount,
    shipping,
    total: discounted + shipping,
    freeShipping,
  };
}
