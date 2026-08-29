"use server";

import { put } from "@vercel/blob";
import { findBlobToken } from "@/lib/admin/blob-token";

export interface UploadResult {
  url?: string;
  error?: string;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Uploads a product or collection photo to Vercel Blob. Requires a Blob
 * store connected in Vercel — the form falls back to a manual "paste an
 * image URL" field when none is configured. Shared by ProductForm.tsx and
 * CollectionForm.tsx — lives here (not under products/) since it was
 * already being used cross-purpose by both before this rename. */
export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  const token = findBlobToken();
  if (!token) {
    return {
      error:
        "Photo uploads aren't set up yet — add a Blob store (Vercel dashboard → Storage → Blob) and redeploy, or paste an image URL below instead.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "That photo is too large (max 8MB)." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Use a JPEG, PNG, WebP or AVIF photo." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(key, file, { access: "public", token });
  return { url: blob.url };
}
