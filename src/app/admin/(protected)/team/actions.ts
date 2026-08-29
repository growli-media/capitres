"use server";

import { revalidatePath } from "next/cache";
import { isValidEmail } from "@/lib/server/records";
import { requireUserSession } from "@/lib/admin/auth";
import { addToAllowlist, removeFromAllowlist, isAllowed } from "@/lib/admin/allowlist";
import {
  countEnabledAdmins,
  setDisabled,
  setUserPermissions,
  getUserById,
  getUserByEmail,
  updateOwnProfile,
  normalizeEmail,
} from "@/lib/admin/users";
import { isPermission, type Permission } from "@/lib/admin/permissions";

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

/** Owner-only — checks the caller's own is_owner, not just "any real
 * account" (requireUserSession() alone). Can't touch owners: an owner's
 * access always comes from is_owner, never from this array, so there's
 * nothing meaningful to set for one, and it keeps a non-owner from being
 * granted "team" (there is no such permission — see permissions.ts) or
 * from this action being used to edit another owner's access. */
export async function updateUserPermissionsAction(
  userId: string,
  formData: FormData,
): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  const caller = await getUserById(session.id);
  if (!caller?.isOwner) return;

  const target = await getUserById(userId);
  if (!target || target.isOwner) return;

  const permissions = formData.getAll("permissions").map(String).filter(isPermission) as Permission[];
  await setUserPermissions(userId, permissions);
  revalidatePath("/admin/team");
}

/** Self-service only — always resolves the target from the caller's own
 * session, never from client input, so an authenticated request can never
 * edit a different admin's profile. */
export async function updateOwnProfileAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireUserSession();
  if (!session) return { error: "Sign in with a named account to edit your profile." };

  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();

  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  const current = await getUserById(session.id);
  if (!current) return { error: "Account not found." };

  const normalized = normalizeEmail(email);
  if (normalized !== current.email) {
    if (!(await isAllowed(normalized))) {
      return { error: "That email isn't approved yet — add it below first." };
    }
    const existing = await getUserByEmail(normalized);
    if (existing && existing.id !== session.id) {
      return { error: "That email is already in use by another account." };
    }
  }

  await updateOwnProfile(session.id, { firstName, lastName, phone, role, company, email });
  revalidatePath("/admin/team");
  return {};
}
