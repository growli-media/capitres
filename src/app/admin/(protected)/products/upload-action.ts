"use server";

import { put } from "@vercel/blob";

export interface UploadResult {
  url?: string;
  error?: string;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Finds the Vercel Blob read-write token. The standard name is
 * BLOB_READ_WRITE_TOKEN, but when a project has more than one Blob store
 * connected, Vercel can only give that exact name to one of them and
 * prefixes the others (e.g. CAPITRES_BLOB_READ_WRITE_TOKEN). Any env var
 * ending in READ_WRITE_TOKEN is a Blob token, so fall back to the first
 * one we find — either store accepts the upload.
 */
function findBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("READ_WRITE_TOKEN") && value) return value;
  }
  return undefined;
}

/** Uploads a product photo to Vercel Blob. Requires a Blob store connected
 * in Vercel — the form falls back to a manual "paste an image URL" field
 * when none is configured. */
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
