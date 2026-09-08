"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPromoCode,
  deletePromoCode,
  promoCodeExists,
  updatePromoCode,
  type PromoCodeInput,
  type PromoCodeType,
} from "@/lib/admin/promo-codes";
import { requirePermission } from "@/lib/admin/permissions";
import { logAdminActivity } from "@/lib/admin/activity";

export interface FormState {
  error?: string;
}

const TYPES: PromoCodeType[] = ["percent", "fixed", "free-shipping"];

/** Day-only date inputs (no time-of-day, see PromoCodeForm) — starts_at
 * is midnight UTC that day, ends_at is the last instant of that day, so
 * an end date stays valid through the whole day the admin picked. */
function parseDateBoundary(value: string, endOfDay: boolean): string | null {
  if (!value) return null;
  return `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
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
  if (type !== "free-shipping") {
    value = Number(formData.get("value") ?? "");
    if (!Number.isFinite(value) || value <= 0) {
      return { error: "Enter a discount value greater than 0." };
    }
    if (type === "percent" && value > 100) {
      return { error: "A percentage discount can't exceed 100." };
    }
    value = Math.round(value);
  }

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

  return { code, type: type as PromoCodeType, value, startsAt, endsAt, maxUses };
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
