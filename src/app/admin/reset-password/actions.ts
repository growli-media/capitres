"use server";

import { redirect } from "next/navigation";
import { getUserByEmail, hashPassword, resetPasswordAndTotp } from "@/lib/admin/users";
import { verifyResetCode } from "@/lib/admin/reset-codes";

export async function resetPassword(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 10) {
    return { error: "Password must be at least 10 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const validCode = await verifyResetCode(email, code);
  if (!validCode) {
    return { error: "Incorrect or expired code." };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return { error: "Incorrect or expired code." };
  }

  const passwordHash = await hashPassword(password);
  await resetPasswordAndTotp(user.id, passwordHash);
  redirect("/admin/login");
}
