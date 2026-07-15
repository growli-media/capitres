"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PromoCode } from "@/lib/commerce/config";
import { computeTotals, findPromo } from "@/lib/commerce/config";
import type { LocalizedString } from "@/lib/content";
import type { ProductImage } from "@/lib/catalog/types";

export interface GiftCardDetails {
  denomination: number;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  message: string;
}

export interface CartLine {
  /** Stable identity for the line (product+variant, or unique per gift card). */
  key: string;
  productSlug: string;
  variantId?: string;
  size?: string;
  qty: number;
  /** Unit price snapshot in IQD (server re-validates at checkout). */
  unitAmount: number;
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
  isOpen: boolean;
  hasHydrated: boolean;
  open: () => void;
  close: () => void;
  addLine: (line: Omit<CartLine, "key"> & { key?: string }) => void;
  removeLine: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  applyPromo: (code: string) => boolean;
  removePromo: () => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promoCode: undefined,
      isOpen: false,
      hasHydrated: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addLine: (line) => {
        const key =
          line.key ??
          (line.giftCard
            ? `gift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
            : `${line.productSlug}:${line.variantId}`);
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
      applyPromo: (code) => {
        const promo = findPromo(code);
        if (!promo) return false;
        set({ promoCode: promo.code });
        return true;
      },
      removePromo: () => set({ promoCode: undefined }),
      clear: () => set({ lines: [], promoCode: undefined }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "capitres-cart-v1",
      partialize: (state) => ({
        lines: state.lines,
        promoCode: state.promoCode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
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
  const code = useCart((s) => s.promoCode);
  return code ? findPromo(code) : undefined;
}

export function useCartTotals() {
  const lines = useCart((s) => s.lines);
  const promo = useCartPromo();
  const subtotal = lines.reduce((sum, l) => sum + l.unitAmount * l.qty, 0);
  const physicalItems = lines.some((l) => !l.giftCard);
  return computeTotals(subtotal, promo, { physicalItems });
}
