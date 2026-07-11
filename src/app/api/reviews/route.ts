import { NextRequest, NextResponse } from "next/server";
import { appendRecord } from "@/lib/server/records";

export async function POST(request: NextRequest) {
  const { productSlug, author, rating, text, locale } = (await request
    .json()
    .catch(() => ({}))) as {
    productSlug?: string;
    author?: string;
    rating?: number;
    text?: string;
    locale?: string;
  };

  const stars = Number(rating);
  if (
    !productSlug ||
    !author?.trim() ||
    !text?.trim() ||
    !Number.isInteger(stars) ||
    stars < 1 ||
    stars > 5
  ) {
    return NextResponse.json({ error: "invalid-input" }, { status: 400 });
  }

  await appendRecord("reviews", {
    productSlug,
    author: author.trim().slice(0, 80),
    rating: stars,
    text: text.trim().slice(0, 2000),
    locale,
    // TODO(production): reviews land in .data/reviews.json for moderation;
    // surface them back into the catalog once approved.
  });
  return NextResponse.json({ ok: true });
}
