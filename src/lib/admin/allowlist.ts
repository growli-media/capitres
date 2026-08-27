import "server-only";
import { sql } from "@/lib/db/client";
import { normalizeEmail } from "./users";

export interface AllowlistEntry {
  email: string;
  createdAt: string;
  /** Whether that email has actually signed up yet. */
  hasAccount: boolean;
  /** Whether the account (if any) finished 2FA enrollment. */
  totpEnabled: boolean;
  disabled: boolean;
}

export async function isAllowed(email: string): Promise<boolean> {
  const rows = await sql<{ exists: boolean }[]>`
    select exists(select 1 from admin_allowlist where email = ${normalizeEmail(email)}) as exists
  `;
  return !!rows[0]?.exists;
}

/** Approved emails, joined against whatever account (if any) exists for
 * each — so the Team page can show approved-but-not-signed-up vs.
 * signed-up-but-not-enrolled vs. fully set up, in one list. */
export async function listAllowlist(): Promise<AllowlistEntry[]> {
  const rows = await sql<
    { email: string; created_at: string; has_account: boolean; totp_enabled: boolean | null; disabled: boolean | null }[]
  >`
    select a.email, a.created_at::text as created_at,
           (u.id is not null) as has_account,
           u.totp_enabled, u.disabled
    from admin_allowlist a
    left join admin_users u on u.email = a.email
    order by a.created_at asc
  `;
  return rows.map((r) => ({
    email: r.email,
    createdAt: r.created_at,
    hasAccount: r.has_account,
    totpEnabled: r.totp_enabled ?? false,
    disabled: r.disabled ?? false,
  }));
}

export async function addToAllowlist(email: string): Promise<void> {
  await sql`
    insert into admin_allowlist (email) values (${normalizeEmail(email)})
    on conflict (email) do nothing
  `;
}

export async function removeFromAllowlist(email: string): Promise<void> {
  await sql`delete from admin_allowlist where email = ${normalizeEmail(email)}`;
}
