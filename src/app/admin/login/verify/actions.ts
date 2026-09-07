"use server";

import { redirect } from "next/navigation";
import {
  clearPending2fa,
  createUserSession,
  readPending2fa,
} from "@/lib/admin/auth";
import {
  getUserById,
  isLocked,
  recordFailedAttempt,
  resetFailedAttempts,
} from "@/lib/admin/users";
import { verifyTotpToken } from "@/lib/admin/totp";
import { grantPreviewAccess } from "@/lib/launch-gate";

export async function verifyLogin(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const userId = await readPending2fa();
  if (!userId) redirect("/admin/login");

  const user = await getUserById(userId);
  if (!user || user.disabled || !user.totpSecret) redirect("/admin/login");
  if (isLocked(user)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const code = String(formData.get("code") ?? "");
  if (!verifyTotpToken(user.totpSecret, code)) {
    await recordFailedAttempt(userId);
    return { error: "Incorrect code." };
  }

  await resetFailedAttempts(userId);
  await clearPending2fa();
  await createUserSession(userId, user.tokenVersion);

  // See admin/login/page.tsx's doc comment on this same param.
  if (String(formData.get("next") ?? "") === "preview") {
    await grantPreviewAccess();
    redirect("/");
  }
  redirect("/admin");
}
