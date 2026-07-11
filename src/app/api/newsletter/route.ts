import { NextRequest, NextResponse } from "next/server";
import { appendRecord, isValidEmail } from "@/lib/server/records";

export async function POST(request: NextRequest) {
  const { email, locale } = (await request.json().catch(() => ({}))) as {
    email?: string;
    locale?: string;
  };
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "invalid-email" }, { status: 400 });
  }
  await appendRecord("newsletter", { email: email.trim(), locale });
  return NextResponse.json({ ok: true });
}
