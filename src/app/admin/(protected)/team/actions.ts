"use server";

import { revalidatePath } from "next/cache";
import { isValidEmail } from "@/lib/server/records";
import { requireUserSession } from "@/lib/admin/auth";
import { addToAllowlist, removeFromAllowlist } from "@/lib/admin/allowlist";
import { countEnabledAdmins, setDisabled } from "@/lib/admin/users";

/**
 * Every action here checks the caller's session itself — the legacy
 * shared-password login shouldn't be able to reach account management
 * just because it's authenticated at all, and this is money/access-
 * adjacent enough not to rely only on the protected layout's redirect.
 */

export async function addEmailAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireUserSession();
  if (!session) return { error: "Sign in with a named account to manage the team." };

  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  await addToAllowlist(email);
  revalidatePath("/admin/team");
  return {};
}

export async function removeEmailAction(email: string): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  await removeFromAllowlist(email);
  revalidatePath("/admin/team");
}

export async function setUserDisabledAction(userId: string, disabled: boolean): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;

  if (disabled) {
    if (session.id === userId) return; // can't disable yourself
    const others = await countEnabledAdmins(userId);
    if (others === 0) return; // can't disable the last enabled admin
  }

  await setDisabled(userId, disabled);
  revalidatePath("/admin/team");
}
