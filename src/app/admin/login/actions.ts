"use server";

import { redirect } from "next/navigation";
import {
  createLegacySession,
  legacyLoginAvailable,
  setPending2fa,
  setPendingEnroll,
  verifyLegacyCredentials,
} from "@/lib/admin/auth";
import {
  dummyPasswordCompare,
  getUserByEmail,
  isLocked,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyPassword,
} from "@/lib/admin/users";

export async function loginWithEmail(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await getUserByEmail(email);
  if (!user || user.disabled) {
    await dummyPasswordCompare();
    return { error: "Incorrect email or password." };
  }
  if (isLocked(user)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await recordFailedAttempt(user.id);
    return { error: "Incorrect email or password." };
  }
  await resetFailedAttempts(user.id);

  if (!user.totpEnabled) {
    await setPendingEnroll(user.id);
    redirect("/admin/enroll-2fa");
  }
  await setPending2fa(user.id);
  redirect("/admin/login/verify");
}

export async function loginLegacy(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await legacyLoginAvailable())) {
    return { error: "The legacy login is no longer available." };
  }
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!verifyLegacyCredentials(username, password)) {
    return { error: "Incorrect username or password." };
  }
  await createLegacySession();
  redirect("/admin");
}
