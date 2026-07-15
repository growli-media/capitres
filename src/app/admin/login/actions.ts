"use server";

import { redirect } from "next/navigation";
import { createSession, verifyPassword } from "@/lib/admin/auth";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    return { error: "Incorrect password." };
  }
  await createSession();
  redirect("/admin");
}
