import "server-only";
import { sql } from "@/lib/db/client";

export type PromoCodeType = "percent" | "fixed" | "free-shipping";

export interface AdminPromoCode {
  code: string;
  type: PromoCodeType;
  /** Percentage points for "percent"; whole-IQD amount for "fixed"; null
   * (unused) for "free-shipping". */
  value: number | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  createdAt: string;
}

interface PromoCodeRow {
  code: string;
  type: string;
  value: number | null;
  /** Left as native Date objects (no ::text cast) deliberately — the
   * postgres driver's Date.toISOString() is always UTC regardless of the
   * DB session's own TimeZone setting, whereas a ::text cast renders in
   * *that* setting, which can silently shift a UTC day-boundary (see
   * parseDateBoundary in actions.ts) onto the next/previous calendar day
   * once truncated to just its date part for the form's <input
   * type="date">. */
  starts_at: Date | null;
  ends_at: Date | null;
  max_uses: number | null;
  created_at: Date;
}

function toPromoCode(r: PromoCodeRow): AdminPromoCode {
  return {
    code: r.code,
    type: r.type as PromoCodeType,
    value: r.value,
    startsAt: r.starts_at?.toISOString() ?? null,
    endsAt: r.ends_at?.toISOString() ?? null,
    maxUses: r.max_uses,
    createdAt: r.created_at.toISOString(),
  };
}

export async function listAdminPromoCodes(): Promise<AdminPromoCode[]> {
  const rows = await sql<PromoCodeRow[]>`
    select code, type, value, starts_at, ends_at, max_uses, created_at
    from promo_codes order by created_at desc
  `;
  return rows.map(toPromoCode);
}

export async function getAdminPromoCode(code: string): Promise<AdminPromoCode | undefined> {
  const rows = await sql<PromoCodeRow[]>`
    select code, type, value, starts_at, ends_at, max_uses, created_at
    from promo_codes where code = ${code.toUpperCase()} limit 1
  `;
  return rows[0] ? toPromoCode(rows[0]) : undefined;
}

export async function promoCodeExists(code: string): Promise<boolean> {
  const rows = await sql<{ code: string }[]>`
    select code from promo_codes where code = ${code.toUpperCase()} limit 1
  `;
  return rows.length > 0;
}

export interface PromoCodeInput {
  code: string;
  type: PromoCodeType;
  value: number | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
}

export async function createPromoCode(input: PromoCodeInput): Promise<void> {
  await sql`
    insert into promo_codes (code, type, value, starts_at, ends_at, max_uses)
    values (
      ${input.code.toUpperCase()}, ${input.type}, ${input.value},
      ${input.startsAt}, ${input.endsAt}, ${input.maxUses}
    )
  `;
}

/** Type/value/dates/max-uses only — `code` is the primary key and is
 * read-only from the edit form (see PromoCodeForm.tsx). */
export async function updatePromoCode(
  code: string,
  input: Omit<PromoCodeInput, "code">,
): Promise<void> {
  await sql`
    update promo_codes set
      type = ${input.type},
      value = ${input.value},
      starts_at = ${input.startsAt},
      ends_at = ${input.endsAt},
      max_uses = ${input.maxUses}
    where code = ${code.toUpperCase()}
  `;
}

export async function deletePromoCode(code: string): Promise<void> {
  await sql`delete from promo_codes where code = ${code.toUpperCase()}`;
}
