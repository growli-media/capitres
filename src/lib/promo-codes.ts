import "server-only";
import { sql } from "@/lib/db/client";
import { orderStore } from "@/lib/orders/store";
import type { BogoConfig, PromoCode } from "@/lib/commerce/config";

interface PromoCodeRow {
  code: string;
  type: string;
  value: number | null;
  value_usd_cents: number | null;
  value_eur_cents: number | null;
  region: string | null;
  /** Native Date, not ::text — see the same note in src/lib/admin/promo-codes.ts. */
  starts_at: Date | null;
  ends_at: Date | null;
  max_uses: number | null;
  buy_product_slugs: string[];
  buy_categories: string[];
  get_product_slugs: string[];
  get_categories: string[];
  buy_qty: number | null;
  get_qty: number | null;
  get_discount_percent: number | null;
}

/**
 * Resolves a customer-entered code to an active PromoCode, or undefined if
 * it doesn't exist, hasn't started yet, has expired, doesn't match the
 * given shipping region, or has hit its max-uses limit — every failure
 * collapses to the same undefined so nothing about *why* a code doesn't
 * work leaks to the customer. Used by both /api/promo/validate (no
 * `region` — the cart drawer's "Apply" button runs before the customer has
 * picked a region, so that check is skipped there) and /api/checkout (the
 * final, authoritative check, with `region` known) before an order is
 * created.
 */
export async function validatePromoCode(
  code: string,
  region?: "IQ" | "INTL",
): Promise<PromoCode | undefined> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  const rows = await sql<PromoCodeRow[]>`
    select code, type, value, value_usd_cents, value_eur_cents, region, starts_at, ends_at,
           max_uses, buy_product_slugs, buy_categories, get_product_slugs, get_categories,
           buy_qty, get_qty, get_discount_percent
    from promo_codes where code = ${normalized} limit 1
  `;
  const row = rows[0];
  if (!row) return undefined;

  const now = Date.now();
  if (row.starts_at && row.starts_at.getTime() > now) return undefined;
  if (row.ends_at && row.ends_at.getTime() < now) return undefined;
  if (row.region && region && row.region !== region) return undefined;
  if (row.max_uses !== null) {
    const used = await orderStore.countByPromoCode(row.code);
    if (used >= row.max_uses) return undefined;
  }

  const bogo: BogoConfig | undefined =
    row.type === "bogo"
      ? {
          buyProductSlugs: row.buy_product_slugs,
          buyCategories: row.buy_categories,
          getProductSlugs: row.get_product_slugs,
          getCategories: row.get_categories,
          buyQty: row.buy_qty ?? 1,
          getQty: row.get_qty ?? 1,
          getDiscountPercent: row.get_discount_percent ?? 100,
        }
      : undefined;

  return {
    code: row.code,
    type: row.type as PromoCode["type"],
    value: row.value ?? undefined,
    valueByCurrency:
      row.value_usd_cents != null || row.value_eur_cents != null
        ? { USD: row.value_usd_cents ?? undefined, EUR: row.value_eur_cents ?? undefined }
        : undefined,
    region: row.region as PromoCode["region"],
    bogo,
  };
}
