"use server";

import { revalidatePath } from "next/cache";
import { requireUserSession } from "@/lib/admin/auth";
import {
  createNote,
  updateNote,
  softDeleteNote,
  restoreNote,
  toggleNoteChecked,
  createReply,
  updateReply,
  softDeleteReply,
  getNoteAuthorId,
  getReplyAuthorId,
} from "@/lib/admin/notes";
import { logAdminActivity } from "@/lib/admin/activity";

export interface FormState {
  error?: string;
}

const MAX_LEN = 2000;

function validateBody(raw: FormDataEntryValue | null): string | { error: string } {
  const body = String(raw ?? "").trim();
  if (!body) return { error: "Write something first." };
  if (body.length > MAX_LEN) return { error: `Notes are capped at ${MAX_LEN} characters.` };
  return body;
}

function revalidate() {
  revalidatePath("/admin/notes");
}

export async function createNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireUserSession();
  if (!session) return { error: "Sign in with your own account to post a note." };
  const body = validateBody(formData.get("body"));
  if (typeof body !== "string") return body;

  await createNote(body);
  await logAdminActivity("Posted a note");
  revalidate();
  return {};
}

export async function createReplyAction(
  noteId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireUserSession();
  if (!session) return { error: "Sign in with your own account to reply." };
  const body = validateBody(formData.get("body"));
  if (typeof body !== "string") return body;

  await createReply(noteId, body);
  await logAdminActivity("Replied to a note");
  revalidate();
  return {};
}

/** Author-only — re-fetches the row and checks ownership server-side
 * rather than trusting a client-supplied "is this mine" flag. */
export async function updateNoteAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireUserSession();
  if (!session) return { error: "Sign in with your own account to edit a note." };
  const authorId = await getNoteAuthorId(id);
  if (authorId !== session.id) return { error: "You can only edit your own notes." };
  const body = validateBody(formData.get("body"));
  if (typeof body !== "string") return body;

  await updateNote(id, body);
  revalidate();
  return {};
}

export async function updateReplyAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireUserSession();
  if (!session) return { error: "Sign in with your own account to edit a reply." };
  const authorId = await getReplyAuthorId(id);
  if (authorId !== session.id) return { error: "You can only edit your own replies." };
  const body = validateBody(formData.get("body"));
  if (typeof body !== "string") return body;

  await updateReply(id, body);
  revalidate();
  return {};
}

/** Soft-delete only — never a hard delete from the main view, mirrors
 * Orders exactly. Author-only. */
export async function deleteNoteAction(id: string): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  const authorId = await getNoteAuthorId(id);
  if (authorId !== session.id) return;
  await softDeleteNote(id);
  revalidate();
}

export async function deleteReplyAction(id: string): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  const authorId = await getReplyAuthorId(id);
  if (authorId !== session.id) return;
  await softDeleteReply(id);
  revalidate();
}

/** Author-only — the inverse of delete gets the same ownership rule. */
export async function restoreNoteAction(id: string): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  const authorId = await getNoteAuthorId(id);
  if (authorId !== session.id) return;
  await restoreNote(id);
  revalidate();
}

/** Any admin, not author-gated — checking off a note you didn't write is
 * the whole point. `checked` toggles: true = mark checked, false = undo. */
export async function toggleNoteCheckedAction(noteId: string, checked: boolean): Promise<void> {
  const session = await requireUserSession();
  if (!session) return;
  await toggleNoteChecked(noteId, checked);
  revalidate();
}
