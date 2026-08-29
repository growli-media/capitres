import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAuthenticated } from "@/lib/admin/auth";
import { findBlobToken } from "@/lib/admin/blob-token";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * Client-upload token endpoint for collection videos — NOT a normal
 * Server Action like the image upload, because Vercel Serverless
 * Functions enforce their own ~4.5MB platform-level request-body cap
 * that no Next.js config can raise. This route only ever issues a
 * short-lived upload token; the actual file bytes go straight from the
 * browser to Blob storage via @vercel/blob/client's upload(), bypassing
 * this function (and that cap) entirely. See CollectionForm.tsx for the
 * client side of this flow.
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
          throw new Error("Sign in to upload a video.");
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
