import "server-only";
import { sql } from "@/lib/db/client";
import { orderStore } from "@/lib/orders/store";
import type { PromoCode } from "@/lib/commerce/config";

interface PromoCodeRow {
  code: string;
  type: string;
  value: number | null;
  /** Native Date, not ::text — see the same note in src/lib/admin/promo-codes.ts. */
  starts_at: Date | null;
  ends_at: Date | null;
  max_uses: number | null;
}

/**
 * Resolves a customer-entered code to an active PromoCode, or undefined
 * if it doesn't exist, hasn't started yet, has expired, or has hit its
 * max-uses limit — every failure collapses to the same undefined so
 * nothing about *why* a code doesn't work leaks to the customer (used by
 * both /api/promo/validate for the cart's live "Apply" and by
 * /api/checkout as the final, authoritative check before an order is
 * created).
 */
export async function validatePromoCode(code: string): Promise<PromoCode | undefined> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  const rows = await sql<PromoCodeRow[]>`
    select code, type, value, starts_at, ends_at, max_uses
    from promo_codes where code = ${normalized} limit 1
  `;
  const row = rows[0];
  if (!row) return undefined;

  const now = Date.now();
  if (row.starts_at && row.starts_at.getTime() > now) return undefined;
  if (row.ends_at && row.ends_at.getTime() < now) return undefined;
  if (row.max_uses !== null) {
    const used = await orderStore.countByPromoCode(row.code);
    if (used >= row.max_uses) return undefined;
  }

  return {
    code: row.code,
    type: row.type as PromoCode["type"],
    value: row.value ?? undefined,
  };
}
