"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PromoCode } from "@/lib/commerce/config";
import { computeDisplayTotals, computeTotals } from "@/lib/commerce/config";
import type { LocalizedString } from "@/lib/content";
import type { Currency, ProductImage } from "@/lib/catalog/types";

/** Hits the same DB-backed validation checkout ultimately re-checks
 * (src/lib/promo-codes.ts) — a code is only ever "applied" once this
 * confirms it's currently active and under its usage limit. */
async function fetchPromo(code: string): Promise<PromoCode | undefined> {
  try {
    const res = await fetch(`/api/promo/validate?code=${encodeURIComponent(code)}`);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { promo: PromoCode };
    return data.promo;
  } catch {
    return undefined;
  }
}

export interface GiftCardDetails {
  denomination: number;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  message: string;
}

export interface CartLine {
  /** Stable identity for the line (product+variant+colour, or unique per gift card). */
  key: string;
  productSlug: string;
  variantId?: string;
  size?: string;
  colorKey?: string;
  colorName?: LocalizedString;
  qty: number;
  /** Unit price snapshot in IQD (server re-validates at checkout). */
  unitAmount: number;
  /** Same snapshot idea, per display currency — so the cart shows the
   * exact price the customer saw on the product page, not a freshly
   * re-computed one. Display only; checkout always uses unitAmount (IQD). */
  unitAmountByCurrency: Record<Currency, number>;
  giftCard?: GiftCardDetails;
  /**
   * Product title + image captured at add-to-cart time. The cart and
   * checkout UI render entirely from this snapshot — never a live catalog
   * lookup — so a product that's later edited or removed from the admin
   * doesn't break an in-progress cart, and the customer keeps seeing what
   * they actually picked.
   */
  title: LocalizedString;
  image: ProductImage;
}

interface CartState {
  lines: CartLine[];
  promoCode?: string;
  /** The resolved code, kept alongside promoCode so useCartPromo() stays
   * a synchronous selector — validation itself is async (see fetchPromo
   * above), so this is set once applyPromo()/revalidatePromo() resolves,
   * not derived on every render the way the old sync findPromo() was. */
  promo: PromoCode | null;
  isOpen: boolean;
  hasHydrated: boolean;
  open: () => void;
  close: () => void;
  addLine: (line: Omit<CartLine, "key"> & { key?: string }) => void;
  removeLine: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  applyPromo: (code: string) => Promise<boolean>;
  removePromo: () => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
  /** Re-checks the persisted promoCode against the server on load — a
   * code applied in an earlier visit may have since expired, hit its
   * usage limit, or been deleted; this clears it if so rather than
   * showing a stale "applied" state the server would reject at checkout. */
  revalidatePromo: () => Promise<void>;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promoCode: undefined,
      promo: null,
      isOpen: false,
      hasHydrated: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addLine: (line) => {
        const key =
          line.key ??
          (line.giftCard
            ? `gift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
            : `${line.productSlug}:${line.variantId}:${line.colorKey ?? "default"}`);
        const existing = get().lines.find((l) => l.key === key);
        if (existing && !line.giftCard) {
          set({
            lines: get().lines.map((l) =>
              l.key === key ? { ...l, qty: l.qty + line.qty } : l,
            ),
            isOpen: true,
          });
        } else {
          set({ lines: [...get().lines, { ...line, key }], isOpen: true });
        }
      },
      removeLine: (key) =>
        set({ lines: get().lines.filter((l) => l.key !== key) }),
      setQty: (key, qty) => {
        if (qty <= 0) {
          get().removeLine(key);
          return;
        }
        set({
          lines: get().lines.map((l) => (l.key === key ? { ...l, qty } : l)),
        });
      },
      applyPromo: async (code) => {
        const promo = await fetchPromo(code);
        if (!promo) return false;
        set({ promoCode: promo.code, promo });
        return true;
      },
      removePromo: () => set({ promoCode: undefined, promo: null }),
      clear: () => set({ lines: [], promoCode: undefined, promo: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
      revalidatePromo: async () => {
        const code = get().promoCode;
        if (!code) return;
        const promo = await fetchPromo(code);
        set(promo ? { promo } : { promoCode: undefined, promo: null });
      },
    }),
    {
      name: "capitres-cart-v1",
      partialize: (state) => ({
        lines: state.lines,
        promoCode: state.promoCode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        void state?.revalidatePromo();
      },
    },
  ),
);

export function useCartCount(): number {
  const lines = useCart((s) => s.lines);
  const hasHydrated = useCart((s) => s.hasHydrated);
  if (!hasHydrated) return 0;
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function useCartPromo(): PromoCode | undefined {
  const promo = useCart((s) => s.promo);
  return promo ?? undefined;
}

/** `region` defaults to "IQ" (domestic shipping rate) — pass "INTL" only
 * where the shipping destination is actually known, e.g. checkout once
 * the customer has picked a region. */
export function useCartTotals(region?: "IQ" | "INTL") {
  const lines = useCart((s) => s.lines);
  const promo = useCartPromo();
  const subtotal = lines.reduce((sum, l) => sum + l.unitAmount * l.qty, 0);
  const physicalItems = lines.some((l) => !l.giftCard);
  return computeTotals(subtotal, promo, { physicalItems, region });
}

/** Display-only totals in the given currency — see computeDisplayTotals. */
export function useCartTotalsByCurrency(currency: Currency, region?: "IQ" | "INTL") {
  const lines = useCart((s) => s.lines);
  const promo = useCartPromo();
  const totals = useCartTotals(region);
  const displaySubtotal = lines.reduce(
    (sum, l) => sum + l.unitAmountByCurrency[currency] * l.qty,
    0,
  );
  return computeDisplayTotals(totals, displaySubtotal, promo, currency, region);
}
