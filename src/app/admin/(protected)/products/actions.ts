"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Category, Gender } from "@/lib/catalog/types";
import {
  createProduct,
  deleteProductPermanently,
  markAllVariantsSoldOut,
  setProductArchived,
  slugExists,
  updateProduct,
  type ColorInput,
  type ImageInput,
  type ProductInput,
} from "@/lib/admin/products";

export interface FormState {
  error?: string;
}

const CATEGORIES: Category[] = ["tees", "jerseys", "outerwear", "accessories", "gift-cards"];
const GENDERS: Gender[] = ["men", "women", "unisex"];

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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseInput(formData: FormData, fallbackSlug: string): ProductInput | { error: string } {
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
  if (!CATEGORIES.includes(category)) return { error: "Choose a valid category." };
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
    colors: colorsOf(formData),
    images: images.map((img) => ({
      url: img.url,
      altEn: img.altEn || titleEn,
      altAr: img.altAr || titleAr,
      altKu: img.altKu || titleKu,
    })),
    collectionSlugs: formData.getAll("collectionSlugs").map(String),
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
  const parsed = parseInput(formData, "");
  if ("error" in parsed) return parsed;

  if (await slugExists(parsed.slug)) {
    return { error: `The URL "${parsed.slug}" is already used by another product.` };
  }

  const id = await createProduct(parsed);
  revalidateStorefront();
  redirect(`/admin/products/${id}/edit?created=1`);
}

export async function updateProductAction(
  id: string,
  currentSlug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseInput(formData, currentSlug);
  if ("error" in parsed) return parsed;

  // Slug is read-only from the edit form (see ProductForm), but guard
  // server-side too in case of a stale/tampered request.
  parsed.slug = currentSlug;

  await updateProduct(id, parsed);
  revalidateStorefront();
  return {};
}

export async function toggleArchivedAction(id: string, archived: boolean): Promise<void> {
  await setProductArchived(id, archived);
  revalidateStorefront();
}

export async function markSoldOutAction(id: string): Promise<void> {
  await markAllVariantsSoldOut(id);
  revalidateStorefront();
}

export async function deleteProductAction(id: string): Promise<void> {
  await deleteProductPermanently(id);
  revalidateStorefront();
  redirect("/admin/products");
}
