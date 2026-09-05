"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  collectionSlugExists,
  createCollection,
  deleteCollectionPermanently,
  reorderCollections,
  setCollectionArchived,
  updateCollection,
  type AdminCollectionImage,
  type CollectionInput,
} from "@/lib/admin/collections";
import { requirePermission } from "@/lib/admin/permissions";
import { logAdminActivity } from "@/lib/admin/activity";

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

function allOf(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String);
}

/** Repeated same-named inputs (one row per photo) arrive in DOM order via
 * FormData.getAll — zip the parallel field lists back into one row per
 * index. Mirrors products/actions.ts's imagesOf() exactly. */
function heroImagesOf(formData: FormData): AdminCollectionImage[] {
  const urls = allOf(formData, "heroImageUrl");
  const altEn = allOf(formData, "heroImageAltEn");
  const altAr = allOf(formData, "heroImageAltAr");
  const altKu = allOf(formData, "heroImageAltKu");
  return urls.map((url, i) => ({
    url: url.trim(),
    altEn: (altEn[i] ?? "").trim(),
    altAr: (altAr[i] ?? "").trim(),
    altKu: (altKu[i] ?? "").trim(),
  }));
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

  const heroImages = heroImagesOf(formData).filter((img) => img.url);
  if (heroImages.length === 0) {
    return { error: "Add at least one photo (upload or paste a URL)." };
  }
  // An untitled photo falls back to the collection's own title, same
  // convention as the old single-photo field used.
  for (const img of heroImages) {
    if (!img.altEn) img.altEn = titleEn;
    if (!img.altAr) img.altAr = titleAr;
    if (!img.altKu) img.altKu = titleKu;
  }

  const theme = String(formData.get("theme") ?? "light");
  if (theme !== "light" && theme !== "dark") return { error: "Choose a valid theme." };

  const ALIGNMENTS = ["left", "center", "right"];
  const textAlignEn = String(formData.get("textAlignEn") ?? "left");
  const textAlignAr = String(formData.get("textAlignAr") ?? "right");
  const textAlignKu = String(formData.get("textAlignKu") ?? "right");
  if (!ALIGNMENTS.includes(textAlignEn) || !ALIGNMENTS.includes(textAlignAr) || !ALIGNMENTS.includes(textAlignKu)) {
    return { error: "Choose a valid text alignment." };
  }

  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const publishedDate = String(formData.get("publishedDate") ?? "").trim();
  const publishedWhere = String(formData.get("publishedWhere") ?? "").trim();

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
    heroImages,
    videoUrl: videoUrl || null,
    textAlignEn,
    textAlignAr,
    textAlignKu,
    publishedDate: publishedDate || null,
    publishedWhere: publishedWhere || null,
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
  await requirePermission("collections");
  const parsed = parseInput(formData, "");
  if ("error" in parsed) return parsed;

  if (await collectionSlugExists(parsed.slug)) {
    return { error: `The URL "${parsed.slug}" is already used by another collection.` };
  }

  await createCollection(parsed);
  await logAdminActivity(`Created collection "${parsed.titleEn}"`);
  revalidateStorefront();
  redirect(`/admin/collections/${parsed.slug}/edit?created=1`);
}

export async function updateCollectionAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermission("collections");
  const parsed = parseInput(formData, slug);
  if ("error" in parsed) return parsed;

  // Slug is read-only from the edit form (see CollectionForm), but guard
  // server-side too in case of a stale/tampered request.
  parsed.slug = slug;

  await updateCollection(slug, parsed);
  await logAdminActivity(`Updated collection "${parsed.titleEn}"`);
  revalidateStorefront();
  return {};
}

export async function toggleCollectionArchivedAction(slug: string, archived: boolean): Promise<void> {
  await requirePermission("collections");
  await setCollectionArchived(slug, archived);
  await logAdminActivity(`${archived ? "Archived" : "Unarchived"} collection "${slug}"`);
  revalidateStorefront();
}

export async function deleteCollectionAction(slug: string): Promise<void> {
  await requirePermission("collections");
  await deleteCollectionPermanently(slug);
  await logAdminActivity(`Deleted collection "${slug}"`);
  revalidateStorefront();
  redirect("/admin/collections?deleted=1");
}

/** Drag-reordered list from the collections table — `slugs` is every
 * collection's slug in its new top-to-bottom order. */
export async function reorderCollectionsAction(slugs: string[]): Promise<void> {
  await requirePermission("collections");
  await reorderCollections(slugs);
  revalidateStorefront();
}
