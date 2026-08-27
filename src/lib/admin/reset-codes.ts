import "server-only";
import crypto from "node:crypto";
import { sql } from "@/lib/db/client";
import { hmac, timingSafeEqual } from "./auth";
import { normalizeEmail } from "./users";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Invalidates any prior unused code for this email (so only the most
 * recently requested one can ever succeed), then issues a fresh one.
 * Returns the plaintext code to email — only its HMAC is stored. */
export async function createResetCode(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  await sql`
    update admin_reset_codes set used_at = now()
    where email = ${normalized} and used_at is null
  `;
  const code = generateCode();
  await sql`
    insert into admin_reset_codes (email, code_hash, expires_at)
    values (${normalized}, ${hmac(code)}, now() + make_interval(mins => ${CODE_TTL_MINUTES}))
  `;
  return code;
}

/** Atomically claims one attempt against the most recent outstanding
 * code for this email before comparing, so concurrent guesses can't race
 * past the attempt cap. Marks the code used on success. */
export async function verifyResetCode(email: string, code: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const rows = await sql<{ id: number }[]>`
    select id from admin_reset_codes
    where email = ${normalized} and used_at is null and expires_at > now()
    order by created_at desc limit 1
  `;
  const row = rows[0];
  if (!row) return false;

  const claimed = await sql<{ code_hash: string }[]>`
    update admin_reset_codes
    set attempts = attempts + 1
    where id = ${row.id} and attempts < ${MAX_ATTEMPTS}
    returning code_hash
  `;
  if (!claimed[0]) return false;

  const valid = timingSafeEqual(hmac(code), claimed[0].code_hash);
  if (valid) {
    await sql`update admin_reset_codes set used_at = now() where id = ${row.id}`;
  }
  return valid;
}
