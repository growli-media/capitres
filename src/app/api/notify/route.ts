import { NextRequest, NextResponse } from "next/server";
import { appendRecord, isValidEmail } from "@/lib/server/records";

/** Back-in-stock notification signups from sold-out PDPs. */
export async function POST(request: NextRequest) {
  const { email, productSlug, locale } = (await request
    .json()
    .catch(() => ({}))) as Record<string, string | undefined>;

  if (!email || !isValidEmail(email) || !productSlug) {
    return NextResponse.json({ error: "invalid-input" }, { status: 400 });
  }
  await appendRecord("restock-notify", {
    email: email.trim(),
    productSlug,
    locale,
  });
  return NextResponse.json({ ok: true });
}
