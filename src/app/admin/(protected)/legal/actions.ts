"use server";

import { revalidatePath } from "next/cache";
import { updateLegalPage, type LegalPageInput } from "@/lib/admin/legal-pages";
import { requirePermission } from "@/lib/admin/permissions";
import { logAdminActivity } from "@/lib/admin/activity";

export interface FormState {
  error?: string;
}

function parseInput(formData: FormData): LegalPageInput | { error: string } {
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleKu = String(formData.get("titleKu") ?? "").trim();
  if (!titleEn || !titleAr || !titleKu) {
    return { error: "Title is required in all three languages." };
  }

  const bodyEn = String(formData.get("bodyEn") ?? "").trim();
  const bodyAr = String(formData.get("bodyAr") ?? "").trim();
  const bodyKu = String(formData.get("bodyKu") ?? "").trim();
  if (!bodyEn || !bodyAr || !bodyKu) {
    return { error: "Body text is required in all three languages." };
  }

  return { titleEn, titleAr, titleKu, bodyEn, bodyAr, bodyKu };
}

export async function updateLegalPageAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePermission("legal_pages");
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;

  await updateLegalPage(slug, parsed);
  await logAdminActivity(`Updated page "${parsed.titleEn}"`);
  revalidatePath("/", "layout");
  return {};
}
