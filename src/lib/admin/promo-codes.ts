import "server-only";
import { sql, jsonb } from "@/lib/db/client";

export type PromoCodeType = "percent" | "fixed" | "free-shipping" | "bogo";
export type PromoCodeRegion = "IQ" | "INTL";

export interface AdminPromoCode {
  code: string;
  type: PromoCodeType;
  /** Percentage points for "percent"; whole-IQD amount for "fixed"; null
   * (unused) for "free-shipping"/"bogo". */
  value: number | null;
  /** "fixed" only — admin-set explicit amounts in USD/EUR cents, mirroring
   * products.price_amount_usd_cents/price_amount_eur_cents. null means
   * "convert from value (IQD) instead" — see computeDisplayTotals. */
  valueUsdCents: number | null;
  valueEurCents: number | null;
  /** null = usable from either shipping region. */
  region: PromoCodeRegion | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  /** "bogo" only — see BogoConfig in src/lib/commerce/config.ts. */
  buyProductSlugs: string[];
  buyCategories: string[];
  getProductSlugs: string[];
  getCategories: string[];
  buyQty: number | null;
  getQty: number | null;
  getDiscountPercent: number | null;
  createdAt: string;
}

interface PromoCodeRow {
  code: string;
  type: string;
  value: number | null;
  value_usd_cents: number | null;
  value_eur_cents: number | null;
  region: string | null;
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
  buy_product_slugs: string[];
  buy_categories: string[];
  get_product_slugs: string[];
  get_categories: string[];
  buy_qty: number | null;
  get_qty: number | null;
  get_discount_percent: number | null;
  created_at: Date;
}

function toPromoCode(r: PromoCodeRow): AdminPromoCode {
  return {
    code: r.code,
    type: r.type as PromoCodeType,
    value: r.value,
    valueUsdCents: r.value_usd_cents,
    valueEurCents: r.value_eur_cents,
    region: r.region as PromoCodeRegion | null,
    startsAt: r.starts_at?.toISOString() ?? null,
    endsAt: r.ends_at?.toISOString() ?? null,
    maxUses: r.max_uses,
    buyProductSlugs: r.buy_product_slugs,
    buyCategories: r.buy_categories,
    getProductSlugs: r.get_product_slugs,
    getCategories: r.get_categories,
    buyQty: r.buy_qty,
    getQty: r.get_qty,
    getDiscountPercent: r.get_discount_percent,
    createdAt: r.created_at.toISOString(),
  };
}

export async function listAdminPromoCodes(): Promise<AdminPromoCode[]> {
  const rows = await sql<PromoCodeRow[]>`
    select code, type, value, value_usd_cents, value_eur_cents, region, starts_at, ends_at,
           max_uses, buy_product_slugs, buy_categories, get_product_slugs, get_categories,
           buy_qty, get_qty, get_discount_percent, created_at
    from promo_codes order by created_at desc
  `;
  return rows.map(toPromoCode);
}

export async function getAdminPromoCode(code: string): Promise<AdminPromoCode | undefined> {
  const rows = await sql<PromoCodeRow[]>`
    select code, type, value, value_usd_cents, value_eur_cents, region, starts_at, ends_at,
           max_uses, buy_product_slugs, buy_categories, get_product_slugs, get_categories,
           buy_qty, get_qty, get_discount_percent, created_at
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
  valueUsdCents: number | null;
  valueEurCents: number | null;
  region: PromoCodeRegion | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  buyProductSlugs: string[];
  buyCategories: string[];
  getProductSlugs: string[];
  getCategories: string[];
  buyQty: number | null;
  getQty: number | null;
  getDiscountPercent: number | null;
}

export async function createPromoCode(input: PromoCodeInput): Promise<void> {
  await sql`
    insert into promo_codes (
      code, type, value, value_usd_cents, value_eur_cents, region, starts_at, ends_at,
      max_uses, buy_product_slugs, buy_categories, get_product_slugs, get_categories,
      buy_qty, get_qty, get_discount_percent
    ) values (
      ${input.code.toUpperCase()}, ${input.type}, ${input.value},
      ${input.valueUsdCents}, ${input.valueEurCents}, ${input.region},
      ${input.startsAt}, ${input.endsAt}, ${input.maxUses},
      ${jsonb(input.buyProductSlugs)}, ${jsonb(input.buyCategories)},
      ${jsonb(input.getProductSlugs)}, ${jsonb(input.getCategories)},
      ${input.buyQty}, ${input.getQty}, ${input.getDiscountPercent}
    )
  `;
}

/** Everything but `code` — the code itself is the primary key and is
 * read-only from the edit form (see PromoCodeForm.tsx). */
export async function updatePromoCode(
  code: string,
  input: Omit<PromoCodeInput, "code">,
): Promise<void> {
  await sql`
    update promo_codes set
      type = ${input.type},
      value = ${input.value},
      value_usd_cents = ${input.valueUsdCents},
      value_eur_cents = ${input.valueEurCents},
      region = ${input.region},
      starts_at = ${input.startsAt},
      ends_at = ${input.endsAt},
      max_uses = ${input.maxUses},
      buy_product_slugs = ${jsonb(input.buyProductSlugs)},
      buy_categories = ${jsonb(input.buyCategories)},
      get_product_slugs = ${jsonb(input.getProductSlugs)},
      get_categories = ${jsonb(input.getCategories)},
      buy_qty = ${input.buyQty},
      get_qty = ${input.getQty},
      get_discount_percent = ${input.getDiscountPercent}
    where code = ${code.toUpperCase()}
  `;
}

export async function deletePromoCode(code: string): Promise<void> {
  await sql`delete from promo_codes where code = ${code.toUpperCase()}`;
}
