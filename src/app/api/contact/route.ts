import { NextRequest, NextResponse } from "next/server";
import { appendRecord, isValidEmail } from "@/lib/server/records";

export async function POST(request: NextRequest) {
  const { name, email, subject, message, locale } = (await request
    .json()
    .catch(() => ({}))) as Record<string, string | undefined>;

  if (!name?.trim() || !email || !isValidEmail(email) || !message?.trim()) {
    return NextResponse.json({ error: "invalid-input" }, { status: 400 });
  }
  await appendRecord("contact", {
    name: name.trim(),
    email: email.trim(),
    subject: subject ?? "other",
    message: message.slice(0, 4000),
    locale,
  });
  return NextResponse.json({ ok: true });
}
