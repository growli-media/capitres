import "server-only";

/**
 * Finds the Vercel Blob read-write token. The standard name is
 * BLOB_READ_WRITE_TOKEN, but when a project has more than one Blob store
 * connected, Vercel can only give that exact name to one of them and
 * prefixes the others (e.g. CAPITRES_BLOB_READ_WRITE_TOKEN). Any env var
 * ending in READ_WRITE_TOKEN is a Blob token, so fall back to the first
 * one we find — either store accepts the upload. Shared by the image
 * upload action and the video client-upload route.
 */
export function findBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("READ_WRITE_TOKEN") && value) return value;
  }
  return undefined;
}
