import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAuthenticated } from "@/lib/admin/auth";
import { findBlobToken } from "@/lib/admin/blob-token";

const MAX_BYTES = 80 * 1024 * 1024; // 80MB
const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

/**
 * Client-upload token endpoint for collection videos AND product/collection
 * photos — NOT a normal Server Action, because Vercel Serverless Functions
 * enforce their own ~4.5MB platform-level request-body cap that no Next.js
 * config can raise. Photos used to go through a Server Action
 * (upload-image-action.ts, now deleted) with its own 8MB limit; anything
 * between ~4.5MB and 8MB passed that check but still got rejected by the
 * platform itself, with no useful error — a marketing photo straight off a
 * phone easily lands in that range. This route only ever issues a
 * short-lived upload token; the actual file bytes go straight from the
 * browser to Blob storage via @vercel/blob/client's upload(), bypassing
 * this function (and that cap) entirely. See ProductForm.tsx /
 * CollectionForm.tsx for the client side of this flow.
 *
 * Lives under /admin/, not /api/admin/ — that's load-bearing, not
 * cosmetic. createUserSession() (auth.ts) scopes the session cookie to
 * `path: "/admin"` on purpose, so it isn't sent on every public
 * storefront request. A cookie's path scope only matches by URL prefix,
 * so at /api/admin/blob-upload the browser withheld it on every request,
 * isAuthenticated() always failed, and every real (logged-in) upload
 * attempt got the same generic "Failed to retrieve the client token" as
 * a logged-out one — this is the actual fix for that, not the earlier
 * error-logging alone. Keep this route inside /admin/ if it ever moves
 * again, or give the cookie a broader path deliberately.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      token: findBlobToken(),
      onBeforeGenerateToken: async () => {
        if (!(await isAuthenticated())) {
          throw new Error("Sign in to upload a file.");
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    // The client SDK swallows this response's actual error text and shows
    // its own generic "Failed to retrieve the client token" instead (it
    // only checks res.ok, never reads the body) — log the real reason
    // here so a failure is diagnosable from Vercel's function logs.
    console.error("blob-upload token generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
