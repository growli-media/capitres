"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  collectionSlugExists,
  createCollection,
  deleteCollectionPermanently,
  setCollectionArchived,
  updateCollection,
  type CollectionInput,
} from "@/lib/admin/collections";

export interface FormState {
  error?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseInput(formData: FormData, fallbackSlug: string): CollectionInput | { error: string } {
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleKu = String(formData.get("titleKu") ?? "").trim();
  if (!titleEn || !titleAr || !titleKu) {
    return { error: "Title is required in all three languages." };
  }

  const taglineEn = String(formData.get("taglineEn") ?? "").trim();
  const taglineAr = String(formData.get("taglineAr") ?? "").trim();
  const taglineKu = String(formData.get("taglineKu") ?? "").trim();
  if (!taglineEn || !taglineAr || !taglineKu) {
    return { error: "Tagline is required in all three languages." };
  }

  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const descriptionAr = String(formData.get("descriptionAr") ?? "").trim();
  const descriptionKu = String(formData.get("descriptionKu") ?? "").trim();
  if (!descriptionEn || !descriptionAr || !descriptionKu) {
    return { error: "Description is required in all three languages." };
  }

  const slug = slugify(String(formData.get("slug") ?? "") || fallbackSlug || titleEn);
  if (!slug) return { error: "Couldn't derive a URL slug — please set one." };

  const heroImageUrl = String(formData.get("heroImageUrl") ?? "").trim();
  if (!heroImageUrl) return { error: "Add a cover photo (upload or paste a URL)." };

  const theme = String(formData.get("theme") ?? "light");
  if (theme !== "light" && theme !== "dark") return { error: "Choose a valid theme." };

  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  return {
    slug,
    titleEn,
    titleAr,
    titleKu,
    taglineEn,
    taglineAr,
    taglineKu,
    descriptionEn,
    descriptionAr,
    descriptionKu,
    heroImageUrl,
    heroImageAltEn: String(formData.get("heroImageAltEn") ?? "").trim() || titleEn,
    heroImageAltAr: String(formData.get("heroImageAltAr") ?? "").trim() || titleAr,
    heroImageAltKu: String(formData.get("heroImageAltKu") ?? "").trim() || titleKu,
    theme,
    sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
  };
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
}

export async function createCollectionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseInput(formData, "");
  if ("error" in parsed) return parsed;

  if (await collectionSlugExists(parsed.slug)) {
    return { error: `The URL "${parsed.slug}" is already used by another collection.` };
  }

  await createCollection(parsed);
  revalidateStorefront();
  redirect(`/admin/collections/${parsed.slug}/edit?created=1`);
}

export async function updateCollectionAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseInput(formData, slug);
  if ("error" in parsed) return parsed;

  // Slug is read-only from the edit form (see CollectionForm), but guard
  // server-side too in case of a stale/tampered request.
  parsed.slug = slug;

  await updateCollection(slug, parsed);
  revalidateStorefront();
  return {};
}

export async function toggleCollectionArchivedAction(slug: string, archived: boolean): Promise<void> {
  await setCollectionArchived(slug, archived);
  revalidateStorefront();
}

export async function deleteCollectionAction(slug: string): Promise<void> {
  await deleteCollectionPermanently(slug);
  revalidateStorefront();
  redirect("/admin/collections");
}
