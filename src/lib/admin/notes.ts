import "server-only";
import { sql } from "@/lib/db/client";
import { requireUserSession } from "./auth";
import { getUserById, listUsers } from "./users";

export interface NoteReply {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminNote {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string | null;
  checkedBy: { userId: string; name: string; checkedAt: string }[];
  replies: NoteReply[];
}

interface NoteRow {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}
interface ReplyRow {
  id: string;
  note_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: Date;
  updated_at: Date | null;
}
interface CheckRow {
  note_id: string;
  user_id: string;
  checked_at: Date;
}

/** Resolves the current admin exactly like activity.ts's currentActorName
 * — requireUserSession() (real named account only, so authorship is
 * always resolvable — the legacy shared login has no name) then
 * getUserById(). Returns undefined if there's no real session. */
async function currentActor(): Promise<{ id: string; name: string } | undefined> {
  const session = await requireUserSession();
  if (!session) return undefined;
  const user = await getUserById(session.id);
  if (!user) return undefined;
  return { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email };
}

async function nameResolver(): Promise<Map<string, string>> {
  const users = await listUsers();
  return new Map(
    users.map((u) => [u.id, [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email]),
  );
}

function toReply(r: ReplyRow, names: Map<string, string>): NoteReply {
  return {
    id: r.id,
    authorId: r.author_id,
    authorName: names.get(r.author_id) ?? r.author_name,
    body: r.body,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at?.toISOString() ?? null,
  };
}

async function assemble(
  noteRows: NoteRow[],
  includeRepliesAndChecks: boolean,
): Promise<AdminNote[]> {
  if (noteRows.length === 0) return [];
  const names = await nameResolver();

  let repliesByNote = new Map<string, NoteReply[]>();
  let checksByNote = new Map<string, { userId: string; name: string; checkedAt: string }[]>();
  if (includeRepliesAndChecks) {
    const [replyRows, checkRows] = await Promise.all([
      sql<ReplyRow[]>`
        select id, note_id, author_id, author_name, body, created_at, updated_at
        from admin_note_replies where deleted_at is null order by created_at asc
      `,
      sql<CheckRow[]>`select note_id, user_id, checked_at from admin_note_checks`,
    ]);
    repliesByNote = new Map();
    for (const r of replyRows) {
      const list = repliesByNote.get(r.note_id) ?? [];
      list.push(toReply(r, names));
      repliesByNote.set(r.note_id, list);
    }
    checksByNote = new Map();
    for (const c of checkRows) {
      const list = checksByNote.get(c.note_id) ?? [];
      list.push({ userId: c.user_id, name: names.get(c.user_id) ?? "Someone", checkedAt: c.checked_at.toISOString() });
      checksByNote.set(c.note_id, list);
    }
  }

  return noteRows.map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: names.get(r.author_id) ?? r.author_name,
    body: r.body,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at?.toISOString() ?? null,
    checkedBy: checksByNote.get(r.id) ?? [],
    replies: repliesByNote.get(r.id) ?? [],
  }));
}

export async function listNotes(limit = 100): Promise<AdminNote[]> {
  const noteRows = await sql<NoteRow[]>`
    select id::text as id, author_id, author_name, body, created_at, updated_at, deleted_at
    from admin_notes where deleted_at is null order by created_at desc limit ${limit}
  `;
  return assemble(noteRows, true);
}

/** "Recently deleted" panel — mirrors orderStore.listDeleted(since)
 * exactly. Replies/checks aren't needed for a restore-only view. */
export async function listDeletedNotes(since: Date): Promise<AdminNote[]> {
  const noteRows = await sql<NoteRow[]>`
    select id::text as id, author_id, author_name, body, created_at, updated_at, deleted_at
    from admin_notes where deleted_at is not null and deleted_at >= ${since}
    order by deleted_at desc
  `;
  return assemble(noteRows, false);
}

export async function getNoteAuthorId(id: string): Promise<string | undefined> {
  const rows = await sql<{ author_id: string }[]>`select author_id from admin_notes where id = ${id} limit 1`;
  return rows[0]?.author_id;
}

export async function getReplyAuthorId(id: string): Promise<string | undefined> {
  const rows = await sql<{ author_id: string }[]>`
    select author_id from admin_note_replies where id = ${id} limit 1
  `;
  return rows[0]?.author_id;
}

export async function createNote(body: string): Promise<void> {
  const actor = await currentActor();
  if (!actor) return;
  await sql`insert into admin_notes (author_id, author_name, body) values (${actor.id}, ${actor.name}, ${body})`;
}

export async function updateNote(id: string, body: string): Promise<void> {
  await sql`update admin_notes set body = ${body}, updated_at = now() where id = ${id}`;
}

export async function softDeleteNote(id: string): Promise<void> {
  await sql`update admin_notes set deleted_at = now() where id = ${id}`;
}

export async function restoreNote(id: string): Promise<void> {
  await sql`update admin_notes set deleted_at = null where id = ${id}`;
}

export async function toggleNoteChecked(noteId: string, checked: boolean): Promise<void> {
  const actor = await currentActor();
  if (!actor) return;
  if (checked) {
    await sql`
      insert into admin_note_checks (note_id, user_id) values (${noteId}, ${actor.id})
      on conflict (note_id, user_id) do nothing
    `;
  } else {
    await sql`delete from admin_note_checks where note_id = ${noteId} and user_id = ${actor.id}`;
  }
}

export async function createReply(noteId: string, body: string): Promise<void> {
  const actor = await currentActor();
  if (!actor) return;
  await sql`
    insert into admin_note_replies (note_id, author_id, author_name, body)
    values (${noteId}, ${actor.id}, ${actor.name}, ${body})
  `;
}

export async function updateReply(id: string, body: string): Promise<void> {
  await sql`update admin_note_replies set body = ${body}, updated_at = now() where id = ${id}`;
}

export async function softDeleteReply(id: string): Promise<void> {
  await sql`update admin_note_replies set deleted_at = now() where id = ${id}`;
}
