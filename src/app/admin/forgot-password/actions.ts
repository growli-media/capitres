"use server";

import { isValidEmail } from "@/lib/server/records";
import { getUserByEmail } from "@/lib/admin/users";
import { createResetCode } from "@/lib/admin/reset-codes";
import { sendPasswordResetEmail } from "@/lib/email/resend";

export async function requestReset(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  // Always the same outcome/timing shape whether or not an account
  // exists — don't let this endpoint reveal account membership.
  const user = await getUserByEmail(email);
  if (user && !user.disabled) {
    const code = await createResetCode(email);
    await sendPasswordResetEmail(email, code);
  }

  return { success: true };
}
