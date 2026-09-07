import "server-only";
import { cookies } from "next/headers";
import { hmac, timingSafeEqual } from "@/lib/admin/auth";

/**
 * Temporary pre-launch lock — shows a countdown instead of the storefront
 * until LAUNCH_AT_UTC. Delete this file, its one call site in
 * src/app/[locale]/layout.tsx, the "next=preview" threading through
 * src/app/admin/login/{page.tsx,actions.ts,LoginForm.tsx} and
 * src/app/admin/login/verify/{page.tsx,actions.ts,VerifyForm.tsx}, and
 * src/components/launch/ once the site has actually gone live; nothing
 * else in the codebase depends on any of this.
 *
 * 2026-09-07T15:00:00Z = 18:00 Asia/Baghdad on 2026-09-07 — Baghdad is a
 * fixed UTC+3 year-round (no DST since 2008), so this never needs
 * adjusting for the date it's set to.
 */
export const LAUNCH_AT_UTC = "2026-09-07T15:00:00.000Z";

export function isBeforeLaunch(now: Date = new Date()): boolean {
  return now.getTime() < new Date(LAUNCH_AT_UTC).getTime();
}

/* ------------------------------------------------------------------ */
/* Admin preview bypass — lets an already-authenticated admin (real     */
/* password + mandatory TOTP, same as /admin itself) see the real site  */
/* before LAUNCH_AT_UTC. Reuses auth.ts's own signing helpers (hmac,     */
/* timingSafeEqual) rather than a new secret, but is a fully separate    */
/* cookie: the real admin session cookie is scoped to path "/admin" and  */
/* never sent on a request to "/", so it can't double as this signal.    */
/* ------------------------------------------------------------------ */

const PREVIEW_COOKIE = "capitres_launch_preview";
const PREVIEW_TTL_MS = 12 * 60 * 60 * 1000; // 12h — well past LAUNCH_AT_UTC regardless of when it's granted

/** Only ever called after a full admin login (see verify/actions.ts and
 * login/page.tsx's already-authenticated fast path) — this file grants
 * no access on its own, it just remembers that admin auth already ran. */
export async function grantPreviewAccess(): Promise<void> {
  const store = await cookies();
  const exp = Date.now() + PREVIEW_TTL_MS;
  const encoded = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  store.set(PREVIEW_COOKIE, `${encoded}.${hmac(encoded)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PREVIEW_TTL_MS / 1000,
  });
}

export async function hasPreviewAccess(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(PREVIEW_COOKIE)?.value;
  if (!token) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  if (!timingSafeEqual(hmac(encoded), signature)) return false;
  try {
    const { exp } = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as { exp: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
