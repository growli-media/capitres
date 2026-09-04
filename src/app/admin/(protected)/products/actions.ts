"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Category, Gender } from "@/lib/catalog/types";
import { catalog } from "@/lib/catalog";
import {
  createProduct,
  deleteProductPermanently,
  markAllVariantsSoldOut,
  setProductArchived,
  setProductPrice,
  slugExists,
  updateProduct,
  type ColorInput,
  type ImageInput,
  type ProductInput,
} from "@/lib/admin/products";
import { requirePermission } from "@/lib/admin/permissions";
import { logAdminActivity } from "@/lib/admin/activity";

export interface FormState {
  error?: string;
}

const GENDERS: Gender[] = ["men", "women", "unisex"];

async function validCategorySlugs(): Promise<string[]> {
  return (await catalog.getCategories()).map((c) => c.slug);
}

function linesOf(formData: FormData, key: string): string[] {
  return String(formData.get(key) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function allOf(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String);
}

/** Repeated same-named inputs (one row per photo/color) arrive in DOM
 * order via FormData.getAll — zip the parallel field lists back into
 * one row per index. */
function imagesOf(formData: FormData): ImageInput[] {
  const urls = allOf(formData, "imageUrl");
  const altEn = allOf(formData, "imageAltEn");
  const altAr = allOf(formData, "imageAltAr");
  const altKu = allOf(formData, "imageAltKu");
  return urls.map((url, i) => ({
    url: url.trim(),
    altEn: (altEn[i] ?? "").trim(),
    altAr: (altAr[i] ?? "").trim(),
    altKu: (altKu[i] ?? "").trim(),
  }));
}

function colorsOf(formData: FormData): ColorInput[] {
  const hex = allOf(formData, "colorHex");
  const nameEn = allOf(formData, "colorNameEn");
  const nameAr = allOf(formData, "colorNameAr");
  const nameKu = allOf(formData, "colorNameKu");
  return hex.map((h, i) => ({
    hex: h,
    nameEn: (nameEn[i] ?? "").trim(),
    nameAr: (nameAr[i] ?? "").trim(),
    nameKu: (nameKu[i] ?? "").trim(),
  }));
}

/** Optional admin-set price field, entered as dollars/euros (e.g. "49.99"),
 * stored in cents. Blank means "not set" (falls back to a computed
 * conversion for display) — not an error. */
function parseOptionalCents(
  raw: string,
  label: string,
): { value: number | null } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null };
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) {
    return { error: `${label} must be a positive number.` };
  }
  return { value: Math.round(num * 100) };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseInput(
  formData: FormData,
  fallbackSlug: string,
  validCategories: string[],
): ProductInput | { error: string } {
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleKu = String(formData.get("titleKu") ?? "").trim();
  if (!titleEn || !titleAr || !titleKu) {
    return { error: "Title is required in all three languages." };
  }

  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const descriptionAr = String(formData.get("descriptionAr") ?? "").trim();
  const descriptionKu = String(formData.get("descriptionKu") ?? "").trim();
  if (!descriptionEn || !descriptionAr || !descriptionKu) {
    return { error: "Description is required in all three languages." };
  }

  const category = String(formData.get("category") ?? "") as Category;
  if (!validCategories.includes(category)) return { error: "Choose a valid category." };
  const gender = String(formData.get("gender") ?? "") as Gender;
  if (!GENDERS.includes(gender)) return { error: "Choose a valid gender." };

  const priceAmount = Number(formData.get("priceAmount"));
  if (!Number.isInteger(priceAmount) || priceAmount <= 0) {
    return { error: "Price must be a whole number greater than zero." };
  }
  const compareRaw = String(formData.get("compareAtAmount") ?? "").trim();
  const compareAtAmount = compareRaw ? Number(compareRaw) : null;
  if (compareAtAmount !== null && (!Number.isInteger(compareAtAmount) || compareAtAmount <= priceAmount)) {
    return { error: "The discount's 'was' price must be a whole number greater than the current price." };
  }

  const priceUsd = parseOptionalCents(String(formData.get("priceAmountUsd") ?? ""), "USD price");
  if ("error" in priceUsd) return priceUsd;
  const compareUsd = parseOptionalCents(
    String(formData.get("compareAtAmountUsd") ?? ""),
    "USD discount price",
  );
  if ("error" in compareUsd) return compareUsd;
  if (
    compareUsd.value !== null &&
    priceUsd.value !== null &&
    compareUsd.value <= priceUsd.value
  ) {
    return { error: "The USD discount's 'was' price must be greater than the USD price." };
  }

  const priceEur = parseOptionalCents(String(formData.get("priceAmountEur") ?? ""), "EUR price");
  if ("error" in priceEur) return priceEur;
  const compareEur = parseOptionalCents(
    String(formData.get("compareAtAmountEur") ?? ""),
    "EUR discount price",
  );
  if ("error" in compareEur) return compareEur;
  if (
    compareEur.value !== null &&
    priceEur.value !== null &&
    compareEur.value <= priceEur.value
  ) {
    return { error: "The EUR discount's 'was' price must be greater than the EUR price." };
  }

  const detailsEn = linesOf(formData, "detailsEn");
  const detailsAr = linesOf(formData, "detailsAr");
  const detailsKu = linesOf(formData, "detailsKu");
  if (detailsEn.length !== detailsAr.length || detailsEn.length !== detailsKu.length) {
    return { error: "Details need the same number of lines in each language." };
  }

  const slug = slugify(String(formData.get("slug") ?? "") || fallbackSlug || titleEn);
  if (!slug) return { error: "Couldn't derive a URL slug — please set one." };

  const images = imagesOf(formData);
  if (!images.some((img) => img.url)) {
    return { error: "Add at least one product photo (upload or paste a URL)." };
  }

  const sizesRaw = String(formData.get("sizes") ?? "").trim();
  const variants = sizesRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [size, stockStr] = line.split(",").map((s) => s.trim());
      return { size, stock: Math.max(0, Number(stockStr ?? 0) || 0) };
    })
    .filter((v) => v.size);

  const isGiftCard = category === "gift-cards";
  let giftcardDenominations: number[] | null = null;
  if (isGiftCard) {
    giftcardDenominations = String(formData.get("giftcardDenominations") ?? "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (giftcardDenominations.length === 0) {
      return { error: "Gift cards need at least one denomination (comma-separated amounts)." };
    }
  }
  if (!isGiftCard && variants.length === 0) {
    return { error: "Add at least one size (e.g. \"M, 10\" — one per line)." };
  }

  return {
    slug,
    titleEn,
    titleAr,
    titleKu,
    descriptionEn,
    descriptionAr,
    descriptionKu,
    detailsEn,
    detailsAr,
    detailsKu,
    category,
    gender,
    priceAmount,
    compareAtAmount,
    priceAmountUsdCents: priceUsd.value,
    compareAtAmountUsdCents: compareUsd.value,
    priceAmountEurCents: priceEur.value,
    compareAtAmountEurCents: compareEur.value,
    colors: colorsOf(formData),
    images: images.map((img) => ({
      url: img.url,
      altEn: img.altEn || titleEn,
      altAr: img.altAr || titleAr,
      altKu: img.altKu || titleKu,
    })),
    collectionSlugs: formData.getAll("collectionSlugs").map(String),
    relatedProductSlugs: formData.getAll("relatedProductSlugs").map(String),
    isNew: formData.get("isNew") === "on",
    featured: formData.get("featured") === "on",
    giftcardDenominations: isGiftCard ? giftcardDenominations : null,
    variants: isGiftCard ? [{ size: "DIGITAL", stock: 9999 }] : variants,
  };
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
}

export async function createProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermission("products");
  const parsed = parseInput(formData, "", await validCategorySlugs());
  if ("error" in parsed) return parsed;

  if (await slugExists(parsed.slug)) {
    return { error: `The URL "${parsed.slug}" is already used by another product.` };
  }

  const id = await createProduct(parsed);
  await logAdminActivity(`Created product "${parsed.titleEn}"`);
  revalidateStorefront();
  redirect(`/admin/products/${id}/edit?created=1`);
}

export async function updateProductAction(
  id: string,
  currentSlug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermission("products");
  const parsed = parseInput(formData, currentSlug, await validCategorySlugs());
  if ("error" in parsed) return parsed;

  // Slug is read-only from the edit form (see ProductForm), but guard
  // server-side too in case of a stale/tampered request.
  parsed.slug = currentSlug;

  await updateProduct(id, parsed);
  await logAdminActivity(`Updated product "${parsed.titleEn}"`);
  revalidateStorefront();
  return {};
}

export async function toggleArchivedAction(id: string, archived: boolean): Promise<void> {
  await requirePermission("products");
  await setProductArchived(id, archived);
  await logAdminActivity(`${archived ? "Archived" : "Unarchived"} product ${id}`);
  revalidateStorefront();
}

export async function markSoldOutAction(id: string): Promise<void> {
  await requirePermission("products");
  await markAllVariantsSoldOut(id);
  await logAdminActivity(`Marked product ${id} as sold out`);
  revalidateStorefront();
}

export async function deleteProductAction(id: string): Promise<void> {
  await requirePermission("products");
  await deleteProductPermanently(id);
  await logAdminActivity(`Deleted product ${id}`);
  revalidateStorefront();
  redirect("/admin/products?deleted=1");
}

/** Inline price edit from the Products table row. */
export async function updateProductPriceAction(
  id: string,
  priceAmount: number,
): Promise<{ error?: string }> {
  await requirePermission("products");
  if (!Number.isFinite(priceAmount) || priceAmount <= 0) {
    return { error: "Enter a valid price." };
  }
  await setProductPrice(id, Math.round(priceAmount));
  await logAdminActivity(`Changed price for product ${id}`);
  revalidateStorefront();
  return {};
}

export async function bulkArchiveProductsAction(ids: string[], archived: boolean): Promise<void> {
  await requirePermission("products");
  await Promise.all(ids.map((id) => setProductArchived(id, archived)));
  await logAdminActivity(`${archived ? "Archived" : "Unarchived"} ${ids.length} product${ids.length === 1 ? "" : "s"}`);
  revalidateStorefront();
}

export async function bulkDeleteProductsAction(ids: string[]): Promise<void> {
  await requirePermission("products");
  await Promise.all(ids.map((id) => deleteProductPermanently(id)));
  await logAdminActivity(`Deleted ${ids.length} product${ids.length === 1 ? "" : "s"}`);
  revalidateStorefront();
}
