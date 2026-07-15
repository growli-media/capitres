"use server";

import { put } from "@vercel/blob";

export interface UploadResult {
  url?: string;
  error?: string;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Uploads a product photo to Vercel Blob. Requires BLOB_READ_WRITE_TOKEN —
 * the form falls back to a manual "paste an image URL" field when unset. */
export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      error:
        "Photo uploads aren't set up yet — add BLOB_READ_WRITE_TOKEN (Vercel dashboard → Storage → Blob), or paste an image URL below instead.",
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
  const blob = await put(key, file, { access: "public" });
  return { url: blob.url };
}
