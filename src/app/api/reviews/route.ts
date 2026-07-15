import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

/**
 * Reviews are inserted with approved = false and only appear on the PDP
 * once approved in /admin/reviews — keeps drive-by review spam off the
 * live site without needing a human to write code to publish one.
 */
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

  if (!process.env.DATABASE_URL) {
    // Local demo mode without a database — accept but discard.
    return NextResponse.json({ ok: true });
  }

  const product = await sql<{ slug: string }[]>`
    select slug from products where slug = ${productSlug} limit 1
  `;
  if (!product[0]) {
    return NextResponse.json({ error: "unknown-product" }, { status: 400 });
  }

  const id = `rev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await sql`
    insert into reviews (id, product_slug, author, rating, body, locale, approved)
    values (
      ${id}, ${productSlug}, ${author.trim().slice(0, 80)}, ${stars},
      ${text.trim().slice(0, 2000)}, ${locale ?? null}, false
    )
  `;
  return NextResponse.json({ ok: true });
}
