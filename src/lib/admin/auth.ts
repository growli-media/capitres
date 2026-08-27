import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db/client";

/**
 * Admin auth: real per-user accounts (email + password + mandatory TOTP,
 * see users.ts/totp.ts), plus a legacy shared ADMIN_USERNAME/ADMIN_PASSWORD
 * login kept only as a bootstrap path — see legacyLoginAvailable() below.
 * All cookies here are HMAC-signed with ADMIN_SESSION_SECRET; none are
 * encrypted, so nothing sensitive (passwords, TOTP secrets) ever goes in
 * a payload, only ids and short-lived flags.
 */

const SESSION_COOKIE = "capitres_admin_session";
const PENDING_2FA_COOKIE = "capitres_admin_pending_2fa";
const PENDING_ENROLL_COOKIE = "capitres_admin_pending_enroll";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes — just long enough to enter a code

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set. Generate one with: openssl rand -hex 32",
    );
  }
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Exposed for anything outside this module that needs an HMAC keyed to
 * the same server secret — e.g. hashing password-reset codes, which are
 * short-lived/single-use/attempt-capped and don't need bcrypt's slowness
 * (see reset-codes.ts). */
export const hmac = sign;

export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Constant-time string equality that also hides the inputs' lengths: we
 * compare secret-keyed HMACs (always a fixed-length hex digest) rather
 * than the raw strings, so neither timing nor buffer length leaks
 * anything about the real credential.
 */
function secretEqual(candidate: string, real: string): boolean {
  const a = Buffer.from(sign(candidate));
  const b = Buffer.from(sign(real));
  return crypto.timingSafeEqual(a, b);
}

/** Legacy single shared login — unchanged, but only reachable while
 * legacyLoginAvailable() is true (see below). */
export function verifyLegacyCredentials(username: string, password: string): boolean {
  const realPassword = process.env.ADMIN_PASSWORD;
  if (!realPassword || realPassword === "change-me") return false;
  const realUsername = process.env.ADMIN_USERNAME || "admin";
  // Evaluate both every time (no short-circuit) so a correct username
  // can't be distinguished from a wrong one by response timing.
  const userOk = secretEqual(username, realUsername);
  const passOk = secretEqual(password, realPassword);
  return userOk && passOk;
}

/** The legacy shared password only works until a real account exists —
 * bootstrap-only, not a permanent parallel front door. Once at least one
 * admin has signed up, verified 2FA and isn't disabled, this returns
 * false and the legacy login is refused server-side (not just hidden in
 * the UI). Password reset covers "I forgot my password" from then on;
 * there is deliberately no evergreen shared-secret bypass. */
export async function legacyLoginAvailable(): Promise<boolean> {
  const rows = await sql<{ exists: boolean }[]>`
    select exists(
      select 1 from admin_users where totp_enabled = true and disabled = false
    ) as exists
  `;
  return !rows[0]?.exists;
}

/* ------------------------------------------------------------------ */
/* Generic signed-token helpers                                        */
/* ------------------------------------------------------------------ */

function makeToken(payload: object): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function readToken<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (!timingSafeEqual(sign(encoded), signature)) return null;
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Real session — either a real admin_users account or the legacy path */
/* ------------------------------------------------------------------ */

type SessionPayload =
  | { kind: "user"; sub: string; tokenVersion: number; exp: number }
  | { kind: "legacy"; exp: number };

export type SessionUser = { kind: "user"; id: string } | { kind: "legacy" };

export async function createUserSession(userId: string, tokenVersion: number): Promise<void> {
  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    makeToken({ kind: "user", sub: userId, tokenVersion, exp: Date.now() + SESSION_TTL_MS }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/admin",
      maxAge: SESSION_TTL_MS / 1000,
    },
  );
}

export async function createLegacySession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken({ kind: "legacy", exp: Date.now() + SESSION_TTL_MS }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  // Must match the `path` the cookie was set with in createUserSession()/
  // createLegacySession(), otherwise this deletes a *different*
  // (non-existent) cookie and the original one keeps being sent.
  store.delete({ name: SESSION_COOKIE, path: "/admin" });
}

/** Resolves the current session, re-checking the DB for real accounts
 * so a disabled admin or a token_version bump (password reset, forced
 * logout) invalidates an already-issued cookie immediately — not just
 * future logins. Returns null for anything invalid or expired. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const payload = readToken<SessionPayload>(store.get(SESSION_COOKIE)?.value);
  if (!payload || payload.exp <= Date.now()) return null;

  if (payload.kind === "legacy") return { kind: "legacy" };

  // Defends against a stale cookie from before this file's rewrite (the
  // old payload shape had no `sub`) — same signing secret, so it still
  // verifies, but passing `undefined` straight into the query below
  // would throw rather than just being treated as "not signed in".
  if (payload.kind !== "user" || typeof payload.sub !== "string" || !payload.sub) return null;

  const rows = await sql<{ disabled: boolean; token_version: number }[]>`
    select disabled, token_version from admin_users where id = ${payload.sub} limit 1
  `;
  const row = rows[0];
  if (!row || row.disabled || row.token_version !== payload.tokenVersion) return null;
  return { kind: "user", id: payload.sub };
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}

/** Stricter than isAuthenticated() — only a real named account, not the
 * legacy bootstrap login. Use this to guard anything account-management-
 * adjacent (the Team page): the one shared credential every deploy-access
 * person already knows shouldn't be able to add itself to the allowlist
 * or disable other admins. */
export async function requireUserSession(): Promise<{ id: string } | null> {
  const session = await getSession();
  return session?.kind === "user" ? { id: session.id } : null;
}

/* ------------------------------------------------------------------ */
/* Short-lived pending cookies — password verified but 2FA/enrollment   */
/* still needed before a real session is issued. Distinct cookie names  */
/* (not just a `purpose` field on one shared name) so a token meant for  */
/* one flow can't even be present under the wrong route.                */
/* ------------------------------------------------------------------ */

type PendingPayload = { sub: string; exp: number };

async function setPendingCookie(name: string, userId: string): Promise<void> {
  const store = await cookies();
  store.set(name, makeToken({ sub: userId, exp: Date.now() + PENDING_TTL_MS }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: PENDING_TTL_MS / 1000,
  });
}

async function readPendingCookie(name: string): Promise<string | null> {
  const store = await cookies();
  const payload = readToken<PendingPayload>(store.get(name)?.value);
  if (!payload || payload.exp <= Date.now()) return null;
  return payload.sub;
}

async function clearCookie(name: string): Promise<void> {
  const store = await cookies();
  store.delete({ name, path: "/admin" });
}

export const setPending2fa = (userId: string) => setPendingCookie(PENDING_2FA_COOKIE, userId);
export const readPending2fa = () => readPendingCookie(PENDING_2FA_COOKIE);
export const clearPending2fa = () => clearCookie(PENDING_2FA_COOKIE);

export const setPendingEnroll = (userId: string) => setPendingCookie(PENDING_ENROLL_COOKIE, userId);
export const readPendingEnroll = () => readPendingCookie(PENDING_ENROLL_COOKIE);
export const clearPendingEnroll = () => clearCookie(PENDING_ENROLL_COOKIE);
