import "server-only";
import { sql } from "@/lib/db/client";
import { requireUserSession } from "./auth";
import { getUserById } from "./users";

export interface ActivityEntry {
  id: string;
  actorName: string;
  message: string;
  createdAt: string;
}

interface ActivityRow {
  id: string;
  actor_name: string;
  message: string;
  created_at: string | Date;
}

async function currentActorName(): Promise<string> {
  const session = await requireUserSession();
  if (!session) return "Admin";
  const user = await getUserById(session.id);
  if (!user) return "Admin";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

/**
 * One line in the admin activity feed — called from every mutating
 * Server Action right after its write succeeds, with the same message
 * already shown in that action's toast (see AdminToastProvider.tsx) so
 * the two stay in sync instead of drifting into two different wordings
 * for the same event. Resolves the actor from the current session
 * rather than taking it as a param, so a call site can't misattribute
 * who actually did it.
 */
export async function logAdminActivity(message: string): Promise<void> {
  const actorName = await currentActorName();
  await sql`insert into admin_activity_log (actor_name, message) values (${actorName}, ${message})`;
}

export async function listRecentActivity(limit = 30): Promise<ActivityEntry[]> {
  const rows = await sql<ActivityRow[]>`
    select id::text as id, actor_name, message, created_at
    from admin_activity_log
    order by created_at desc
    limit ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    actorName: r.actor_name,
    message: r.message,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}
