import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single shared admin login — a fixed username (ADMIN_USERNAME, default
 * "admin") and password (ADMIN_PASSWORD), guarding an HMAC-signed cookie.
 * One operator, no per-user accounts or password reset — that would need
 * a users table and an email service, out of scope for this dashboard.
 */

const COOKIE_NAME = "capitres_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

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

function timingSafeEqual(a: string, b: string): boolean {
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

export function verifyCredentials(username: string, password: string): boolean {
  const realPassword = process.env.ADMIN_PASSWORD;
  if (!realPassword || realPassword === "change-me") return false;
  const realUsername = process.env.ADMIN_USERNAME || "admin";
  // Evaluate both every time (no short-circuit) so a correct username
  // can't be distinguished from a wrong one by response timing.
  const userOk = secretEqual(username, realUsername);
  const passOk = secretEqual(password, realPassword);
  return userOk && passOk;
}

function makeToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function tokenIsValid(token: string | undefined): boolean {
  if (!token) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  if (!timingSafeEqual(sign(encoded), signature)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  // Must match the `path` the cookie was set with in createSession(),
  // otherwise this deletes a *different* (non-existent) cookie and the
  // original one — scoped to /admin — keeps being sent by the browser.
  store.delete({ name: COOKIE_NAME, path: "/admin" });
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return tokenIsValid(store.get(COOKIE_NAME)?.value);
}
