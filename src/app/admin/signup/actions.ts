"use server";

import { redirect } from "next/navigation";
import { isValidEmail } from "@/lib/server/records";
import { isAllowed } from "@/lib/admin/allowlist";
import { setPendingEnroll } from "@/lib/admin/auth";
import { createUser, dummyPasswordCompare, getUserByEmail, hashPassword } from "@/lib/admin/users";

export async function signup(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 10) {
    return { error: "Password must be at least 10 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const [allowed, existing] = await Promise.all([isAllowed(email), getUserByEmail(email)]);
  if (!allowed || existing) {
    // Same generic message either way — don't reveal whether the email
    // is simply unapproved or already registered — and do equivalent-
    // cost dummy work so this branch doesn't finish suspiciously faster
    // than the real hash-and-insert below.
    await dummyPasswordCompare();
    return { error: "This email isn't approved for an account, or already has one." };
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash);
  await setPendingEnroll(user.id);
  redirect("/admin/enroll-2fa");
}
