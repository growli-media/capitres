"use server";

import { redirect } from "next/navigation";
import { createSession, verifyCredentials } from "@/lib/admin/auth";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!verifyCredentials(username, password)) {
    return { error: "Incorrect username or password." };
  }
  await createSession();
  redirect("/admin");
}
