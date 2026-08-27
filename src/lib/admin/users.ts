import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db/client";

const BCRYPT_COST = 12;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  totpSecret: string | null;
  totpEnabled: boolean;
  disabled: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  tokenVersion: number;
  createdAt: string;
}

interface AdminUserRow {
  id: string;
  email: string;
  password_hash: string;
  totp_secret: string | null;
  totp_enabled: boolean;
  disabled: boolean;
  failed_attempts: number;
  locked_until: string | null;
  token_version: number;
  created_at: string;
}

function toUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    totpSecret: row.totp_secret,
    totpEnabled: row.totp_enabled,
    disabled: row.disabled,
    failedAttempts: row.failed_attempts,
    lockedUntil: row.locked_until,
    tokenVersion: row.token_version,
    createdAt: row.created_at,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Does an equivalent-cost dummy compare so "wrong password" and "email
 * doesn't exist" take a similar wall-clock time — otherwise skipping
 * bcrypt entirely on the "no such user" branch is a measurable timing
 * tell that reveals account/allowlist membership. */
export async function dummyPasswordCompare(): Promise<void> {
  await bcrypt.compare("dummy-password-for-timing", DUMMY_HASH);
}
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_COST);

export function isLocked(user: Pick<AdminUser, "lockedUntil">): boolean {
  return !!user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now();
}

export async function getUserByEmail(email: string): Promise<AdminUser | undefined> {
  const rows = await sql<AdminUserRow[]>`
    select id, email, password_hash, totp_secret, totp_enabled, disabled,
           failed_attempts, locked_until::text, token_version, created_at::text
    from admin_users where email = ${normalizeEmail(email)} limit 1
  `;
  return rows[0] ? toUser(rows[0]) : undefined;
}

export async function getUserById(id: string): Promise<AdminUser | undefined> {
  const rows = await sql<AdminUserRow[]>`
    select id, email, password_hash, totp_secret, totp_enabled, disabled,
           failed_attempts, locked_until::text, token_version, created_at::text
    from admin_users where id = ${id} limit 1
  `;
  return rows[0] ? toUser(rows[0]) : undefined;
}

export async function createUser(email: string, passwordHash: string): Promise<AdminUser> {
  const id = `u_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const rows = await sql<AdminUserRow[]>`
    insert into admin_users (id, email, password_hash)
    values (${id}, ${normalizeEmail(email)}, ${passwordHash})
    returning id, email, password_hash, totp_secret, totp_enabled, disabled,
              failed_attempts, locked_until::text, token_version, created_at::text
  `;
  return toUser(rows[0]);
}

/** Atomic — increments and applies the lockout in one statement so
 * concurrent wrong attempts can't race past the threshold. */
export async function recordFailedAttempt(id: string): Promise<void> {
  await sql`
    update admin_users
    set failed_attempts = failed_attempts + 1,
        locked_until = case
          when failed_attempts + 1 >= ${MAX_ATTEMPTS}
          then now() + make_interval(mins => ${LOCKOUT_MINUTES})
          else locked_until
        end
    where id = ${id}
  `;
}

export async function resetFailedAttempts(id: string): Promise<void> {
  await sql`
    update admin_users set failed_attempts = 0, locked_until = null where id = ${id}
  `;
}

export async function enableTotp(id: string, secret: string): Promise<void> {
  await sql`
    update admin_users set totp_secret = ${secret}, totp_enabled = true where id = ${id}
  `;
}

/** Password reset also clears 2FA enrollment and bumps token_version —
 * proving email ownership is already this app's accepted recovery
 * signal, so it covers "lost my authenticator" too instead of needing a
 * second, weaker recovery path. Revokes any already-issued session. */
export async function resetPasswordAndTotp(id: string, passwordHash: string): Promise<void> {
  await sql`
    update admin_users
    set password_hash = ${passwordHash},
        totp_secret = null,
        totp_enabled = false,
        failed_attempts = 0,
        locked_until = null,
        token_version = token_version + 1
    where id = ${id}
  `;
}

/** Bumps token_version so any already-open session dies immediately,
 * not just future logins. */
export async function setDisabled(id: string, disabled: boolean): Promise<void> {
  if (disabled) {
    await sql`
      update admin_users
      set disabled = true, token_version = token_version + 1
      where id = ${id}
    `;
  } else {
    await sql`update admin_users set disabled = false where id = ${id}`;
  }
}

export async function countEnabledAdmins(excludingId?: string): Promise<number> {
  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count
    from admin_users
    where disabled = false and totp_enabled = true
      and id != ${excludingId ?? ""}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function listUsers(): Promise<AdminUser[]> {
  const rows = await sql<AdminUserRow[]>`
    select id, email, password_hash, totp_secret, totp_enabled, disabled,
           failed_attempts, locked_until::text, token_version, created_at::text
    from admin_users order by created_at asc
  `;
  return rows.map(toUser);
}
