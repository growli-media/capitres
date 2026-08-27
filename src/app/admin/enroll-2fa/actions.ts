"use server";

import { redirect } from "next/navigation";
import { clearPendingEnroll, createUserSession, readPendingEnroll } from "@/lib/admin/auth";
import { enableTotp, getUserById } from "@/lib/admin/users";
import { verifyTotpToken } from "@/lib/admin/totp";

export async function verifyEnrollment(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const userId = await readPendingEnroll();
  if (!userId) redirect("/admin/login");

  const secret = String(formData.get("secret") ?? "");
  const code = String(formData.get("code") ?? "");

  if (!verifyTotpToken(secret, code)) {
    return { error: "Incorrect code. Try again." };
  }

  await enableTotp(userId, secret);
  await clearPendingEnroll();

  const user = await getUserById(userId);
  if (!user) redirect("/admin/login");
  await createUserSession(userId, user.tokenVersion);
  redirect("/admin");
}
