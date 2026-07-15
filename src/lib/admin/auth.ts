import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single shared admin session — one password (ADMIN_PASSWORD), one
 * HMAC-signed cookie. No per-user accounts: this dashboard has exactly
 * one operator (the client), so a full auth system would be overkill.
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

export function verifyPassword(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || real === "change-me") return false;
  // Pad to a fixed length before comparing so the check is constant-time
  // regardless of the guessed password's length.
  const a = Buffer.from(candidate.padEnd(64, "\0"));
  const b = Buffer.from(real.padEnd(64, "\0"));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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
