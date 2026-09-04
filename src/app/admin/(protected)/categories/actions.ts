"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  categorySlugExists,
  createCategory,
  deleteCategory,
  reorderCategories,
  setCategoryArchived,
  updateCategory,
  type CategoryInput,
} from "@/lib/admin/categories";
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
    .slice(0, 60);
}

function parseInput(formData: FormData, fallbackSlug: string): CategoryInput | { error: string } {
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleKu = String(formData.get("titleKu") ?? "").trim();
  if (!titleEn || !titleAr || !titleKu) {
    return { error: "Name is required in all three languages." };
  }

  const slug = slugify(String(formData.get("slug") ?? "") || fallbackSlug || titleEn);
  if (!slug) return { error: "Couldn't derive a URL slug — please set one." };

  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  return {
    slug,
    titleEn,
    titleAr,
    titleKu,
    sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
  };
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
}

export async function createCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermission("categories");
  const parsed = parseInput(formData, "");
  if ("error" in parsed) return parsed;

  if (await categorySlugExists(parsed.slug)) {
    return { error: `The URL "${parsed.slug}" is already used by another category.` };
  }

  await createCategory(parsed);
  await logAdminActivity(`Created category "${parsed.titleEn}"`);
  revalidateStorefront();
  redirect(`/admin/categories?created=1`);
}

export async function updateCategoryAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermission("categories");
  const parsed = parseInput(formData, slug);
  if ("error" in parsed) return parsed;

  parsed.slug = slug; // slug is locked on edit
  await updateCategory(slug, parsed);
  await logAdminActivity(`Updated category "${parsed.titleEn}"`);
  revalidateStorefront();
  return {};
}

export async function toggleCategoryArchivedAction(slug: string, archived: boolean): Promise<void> {
  await requirePermission("categories");
  await setCategoryArchived(slug, archived);
  await logAdminActivity(`${archived ? "Archived" : "Unarchived"} category "${slug}"`);
  revalidateStorefront();
}

export async function deleteCategoryAction(slug: string): Promise<{ error?: string }> {
  await requirePermission("categories");
  const result = await deleteCategory(slug);
  if (result.error) return result;
  await logAdminActivity(`Deleted category "${slug}"`);
  revalidateStorefront();
  redirect("/admin/categories?deleted=1");
}

/** Drag-reordered list from the categories table — `slugs` is every
 * category's slug in its new top-to-bottom order. */
export async function reorderCategoriesAction(slugs: string[]): Promise<void> {
  await requirePermission("categories");
  await reorderCategories(slugs);
  revalidateStorefront();
}
