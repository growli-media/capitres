"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPromoCode,
  deletePromoCode,
  promoCodeExists,
  updatePromoCode,
  type PromoCodeInput,
  type PromoCodeRegion,
  type PromoCodeType,
} from "@/lib/admin/promo-codes";
import { requirePermission } from "@/lib/admin/permissions";
import { logAdminActivity } from "@/lib/admin/activity";

export interface FormState {
  error?: string;
}

const TYPES: PromoCodeType[] = ["percent", "fixed", "free-shipping", "bogo"];

/** Day-only date inputs (no time-of-day, see PromoCodeForm) — starts_at
 * is midnight UTC that day, ends_at is the last instant of that day, so
 * an end date stays valid through the whole day the admin picked. */
function parseDateBoundary(value: string, endOfDay: boolean): string | null {
  if (!value) return null;
  return `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
}

/** Optional admin-set amount, entered as dollars/euros (e.g. "5.00"),
 * stored in cents. Blank means "not set" (falls back to a computed
 * conversion for display) — not an error. Mirrors products/actions.ts's
 * own parseOptionalCents exactly. */
function parseOptionalCents(raw: string, label: string): { value: number | null } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null };
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) {
    return { error: `${label} must be a positive number.` };
  }
  return { value: Math.round(num * 100) };
}

function allOf(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String).filter(Boolean);
}

function parseInput(formData: FormData): PromoCodeInput | { error: string } {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "A code is required." };
  if (!/^[A-Z0-9-]+$/.test(code)) {
    return { error: "Code can only contain letters, numbers, and hyphens." };
  }

  const type = String(formData.get("type") ?? "");
  if (!TYPES.includes(type as PromoCodeType)) return { error: "Choose a valid discount type." };

  let value: number | null = null;
  let valueUsdCents: number | null = null;
  let valueEurCents: number | null = null;
  if (type === "percent" || type === "fixed") {
    value = Number(formData.get("value") ?? "");
    if (!Number.isFinite(value) || value <= 0) {
      return { error: "Enter a discount value greater than 0." };
    }
    if (type === "percent" && value > 100) {
      return { error: "A percentage discount can't exceed 100." };
    }
    value = Math.round(value);

    if (type === "fixed") {
      const usd = parseOptionalCents(String(formData.get("valueUsd") ?? ""), "USD amount");
      if ("error" in usd) return usd;
      valueUsdCents = usd.value;
      const eur = parseOptionalCents(String(formData.get("valueEur") ?? ""), "EUR amount");
      if ("error" in eur) return eur;
      valueEurCents = eur.value;
    }
  }

  const regionRaw = String(formData.get("region") ?? "");
  const region: PromoCodeRegion | null = regionRaw === "IQ" || regionRaw === "INTL" ? regionRaw : null;

  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();
  const startsAt = parseDateBoundary(startsAtRaw, false);
  const endsAt = parseDateBoundary(endsAtRaw, true);
  if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    return { error: "The end date can't be before the start date." };
  }

  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  let maxUses: number | null = null;
  if (maxUsesRaw) {
    maxUses = Math.round(Number(maxUsesRaw));
    if (!Number.isFinite(maxUses) || maxUses <= 0) {
      return { error: "Max uses must be a whole number greater than 0." };
    }
  }

  let buyProductSlugs: string[] = [];
  let buyCategories: string[] = [];
  let getProductSlugs: string[] = [];
  let getCategories: string[] = [];
  let buyQty: number | null = null;
  let getQty: number | null = null;
  let getDiscountPercent: number | null = null;
  if (type === "bogo") {
    buyProductSlugs = allOf(formData, "buyProductSlugs");
    buyCategories = allOf(formData, "buyCategories");
    getProductSlugs = allOf(formData, "getProductSlugs");
    getCategories = allOf(formData, "getCategories");
    if (buyProductSlugs.length === 0 && buyCategories.length === 0) {
      return { error: "Choose at least one product or category for the \"buy\" side." };
    }
    if (getProductSlugs.length === 0 && getCategories.length === 0) {
      return { error: "Choose at least one product or category for the \"get\" side." };
    }

    buyQty = Math.round(Number(formData.get("buyQty") ?? ""));
    if (!Number.isFinite(buyQty) || buyQty <= 0) {
      return { error: "Buy quantity must be a whole number greater than 0." };
    }
    getQty = Math.round(Number(formData.get("getQty") ?? ""));
    if (!Number.isFinite(getQty) || getQty <= 0) {
      return { error: "Get quantity must be a whole number greater than 0." };
    }
    getDiscountPercent = Math.round(Number(formData.get("getDiscountPercent") ?? ""));
    if (!Number.isFinite(getDiscountPercent) || getDiscountPercent < 1 || getDiscountPercent > 100) {
      return { error: "Reward discount must be a whole number between 1 and 100." };
    }
  }

  return {
    code,
    type: type as PromoCodeType,
    value,
    valueUsdCents,
    valueEurCents,
    region,
    startsAt,
    endsAt,
    maxUses,
    buyProductSlugs,
    buyCategories,
    getProductSlugs,
    getCategories,
    buyQty,
    getQty,
    getDiscountPercent,
  };
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
}

export async function createPromoCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("promo_codes");
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;

  if (await promoCodeExists(parsed.code)) {
    return { error: `The code "${parsed.code}" already exists.` };
  }

  await createPromoCode(parsed);
  await logAdminActivity(`Created promo code "${parsed.code}"`);
  revalidateStorefront();
  redirect(`/admin/promo-codes/${parsed.code}/edit?created=1`);
}

export async function updatePromoCodeAction(
  code: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermission("promo_codes");
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;

  await updatePromoCode(code, parsed);
  await logAdminActivity(`Updated promo code "${code}"`);
  revalidateStorefront();
  return {};
}

export async function deletePromoCodeAction(code: string): Promise<void> {
  await requirePermission("promo_codes");
  await deletePromoCode(code);
  await logAdminActivity(`Deleted promo code "${code}"`);
  revalidateStorefront();
  redirect("/admin/promo-codes?deleted=1");
}
