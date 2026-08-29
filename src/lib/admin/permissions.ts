import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { getUserById } from "./users";
import { type Permission } from "./permissions-shared";

export { PERMISSIONS, PERMISSION_LABELS, isPermission } from "./permissions-shared";
export type { Permission } from "./permissions-shared";

/** { isOwner: true } short-circuits every can() check; permissions is []
 * for the legacy shared-password session (unused in that case) and for
 * signed-out visitors, who fail every check anyway. */
export type AccessLevel = { isOwner: boolean; permissions: Permission[] };

/** Resolves the current session's access level once, so callers that
 * need multiple checks (e.g. the sidebar filtering every nav item) don't
 * repeat the DB lookup. Legacy shared-password sessions are treated as
 * unrestricted for every grantable permission — same as today, before
 * this feature existed, since it's the pre-real-accounts bootstrap path;
 * it already can't reach Team (see requireUserSession in auth.ts). */
export async function getAccessLevel(): Promise<AccessLevel> {
  const session = await getSession();
  if (!session) return { isOwner: false, permissions: [] };
  if (session.kind === "legacy") return { isOwner: true, permissions: [] };
  const user = await getUserById(session.id);
  if (!user) return { isOwner: false, permissions: [] };
  return { isOwner: user.isOwner, permissions: user.permissions };
}

export async function can(permission: Permission): Promise<boolean> {
  const access = await getAccessLevel();
  return access.isOwner || access.permissions.includes(permission);
}

/** Page-level guard — first line of every gated page.tsx. Redirects
 * rather than 404s so a team member who loses access to a section (or
 * never had it) lands somewhere useful instead of a dead end. */
export async function requirePermission(permission: Permission): Promise<void> {
  if (!(await can(permission))) redirect("/admin");
}
