"use server";

import { revalidatePath } from "next/cache";
import { isValidEmail } from "@/lib/server/records";
import { requireUserSession } from "@/lib/admin/auth";
import { addToAllowlist, removeFromAllowlist, isAllowed } from "@/lib/admin/allowlist";
import {
  countEnabledAdmins,
  setDisabled,
  setUserPermissions,
  setUserFullAccess,
  transferOwnership,
  getUserById,
  getUserByEmail,
  updateOwnProfile,
  normalizeEmail,
} from "@/lib/admin/users";
import { isPermission, hasFullControl, type Permission } from "@/lib/admin/permissions";
import { logAdminActivity } from "@/lib/admin/activity";

function displayName(user: { firstName: string | null; lastName: string | null; email: string }): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

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
  const caller = await getUserById(session.id);
  if (!caller || !hasFullControl(caller)) return { error: "You don't have permission to do that." };

  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  await addToAllowlist(email);
  await logAdminActivity(`Approved ${email} for team access`);
  revalidatePath("/admin/team");
  return {};
}

export async function removeEmailAction(email: string): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  const caller = await getUserById(session.id);
  if (!caller || !hasFullControl(caller)) return;
  await removeFromAllowlist(email);
  await logAdminActivity(`Removed ${email} from the team allowlist`);
  revalidatePath("/admin/team");
}

export async function setUserDisabledAction(userId: string, disabled: boolean): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  const caller = await getUserById(session.id);
  if (!caller || !hasFullControl(caller)) return;

  const target = await getUserById(userId);
  if (target?.isOwner) return; // an owner's row is never touched via this path

  if (disabled) {
    if (session.id === userId) return; // can't disable yourself
    const others = await countEnabledAdmins(userId);
    if (others === 0) return; // can't disable the last enabled admin
  }

  await setDisabled(userId, disabled);
  if (target) {
    await logAdminActivity(`${disabled ? "Disabled" : "Enabled"} ${displayName(target)}'s account`);
  }
  revalidatePath("/admin/team");
}

/** Owner or full-access — checks the caller's own hasFullControl(), not
 * just "any real account" (requireUserSession() alone). Can't touch
 * owners: an owner's access always comes from is_owner, never from this
 * array, so there's nothing meaningful to set for one, and it keeps a
 * non-owner from being granted "team" (there is no such permission — see
 * permissions.ts) or from this action being used to edit another owner's
 * access. */
export async function updateUserPermissionsAction(
  userId: string,
  formData: FormData,
): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  const caller = await getUserById(session.id);
  if (!caller || !hasFullControl(caller)) return;

  const target = await getUserById(userId);
  if (!target || target.isOwner) return;

  const permissions = formData.getAll("permissions").map(String).filter(isPermission) as Permission[];
  await setUserPermissions(userId, permissions);
  await logAdminActivity(`Updated access for ${displayName(target)}`);
  revalidatePath("/admin/team");
}

/** Shared by updateOwnProfileAction and updateUserProfileAction — an
 * email change must land on an allowlist-approved address not already
 * claimed by a DIFFERENT account (`excludeId` is whichever account this
 * edit is for, so it doesn't collide with itself). */
async function validateProfileEmailChange(
  normalized: string,
  currentEmail: string,
  excludeId: string,
): Promise<string | undefined> {
  if (normalized === currentEmail) return undefined;
  if (!(await isAllowed(normalized))) {
    return "That email isn't approved yet — add it below first.";
  }
  const existing = await getUserByEmail(normalized);
  if (existing && existing.id !== excludeId) {
    return "That email is already in use by another account.";
  }
  return undefined;
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
  const emailError = await validateProfileEmailChange(normalized, current.email, session.id);
  if (emailError) return { error: emailError };

  await updateOwnProfile(session.id, { firstName, lastName, phone, role, company, email });
  revalidatePath("/admin/team");
  return {};
}

/** Owner or full-access editing a non-owner teammate's profile — same
 * field parsing and email validation as updateOwnProfileAction, just
 * targeting `targetUserId` instead of the caller's own session. */
export async function updateUserProfileAction(
  targetUserId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireUserSession();
  if (!session) return { error: "Sign in with a named account to edit team profiles." };
  const caller = await getUserById(session.id);
  if (!caller || !hasFullControl(caller)) return { error: "You don't have permission to do that." };

  const target = await getUserById(targetUserId);
  if (!target || target.isOwner) return { error: "That account can't be edited here." };

  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();

  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  const normalized = normalizeEmail(email);
  const emailError = await validateProfileEmailChange(normalized, target.email, targetUserId);
  if (emailError) return { error: emailError };

  await updateOwnProfile(targetUserId, { firstName, lastName, phone, role, company, email });
  await logAdminActivity(`Updated ${displayName(target)}'s profile`);
  revalidatePath("/admin/team");
  return {};
}

/** Strict-owner-only — toggling this is one of the two actions that
 * doesn't extend to fullAccess holders (see hasFullControl's doc
 * comment): letting a fullAccess-but-not-owner user grant/revoke
 * fullAccess would let the override escape the one person meant to
 * control it. Can't touch owners: they already have everything, there's
 * nothing meaningful to set. */
export async function setUserFullAccessAction(userId: string, value: boolean): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  const caller = await getUserById(session.id);
  if (!caller?.isOwner) return;

  const target = await getUserById(userId);
  if (!target || target.isOwner) return;

  await setUserFullAccess(userId, value);
  await logAdminActivity(`${value ? "Granted" : "Revoked"} full access ${value ? "to" : "from"} ${displayName(target)}`);
  revalidatePath("/admin/team");
}

/** Strict-owner-only, same reasoning as setUserFullAccessAction — this
 * mints a NEW owner, so it can't extend to fullAccess holders either.
 * `fromId` is always the caller's own session.id, never client input.
 * Target must be an "Active" account (enabled + 2FA-enrolled, matching
 * the table's own statusLabel) so ownership can never land on an account
 * that can't actually sign in and use it. */
export async function transferOwnershipAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireUserSession();
  if (!session) return { error: "Sign in with a named account to transfer ownership." };
  const caller = await getUserById(session.id);
  if (!caller?.isOwner) return { error: "Only the current owner can transfer ownership." };

  const targetUserId = String(formData.get("targetUserId") ?? "").trim();
  if (!targetUserId) return { error: "Choose who to transfer ownership to." };
  if (targetUserId === caller.id) return { error: "You're already the owner." };

  const target = await getUserById(targetUserId);
  if (!target) return { error: "That account no longer exists." };
  if (target.isOwner) return { error: "That account is already the owner." };
  if (target.disabled || !target.totpEnabled) {
    return { error: "That account needs to be active (signed up with 2FA, not disabled) before it can become the owner." };
  }

  await transferOwnership(caller.id, target.id);
  await logAdminActivity(`Transferred ownership to ${displayName(target)}`);
  revalidatePath("/admin/team");
  return {};
}
