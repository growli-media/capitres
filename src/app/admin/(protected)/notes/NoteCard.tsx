"use client";

import { useState, useTransition } from "react";
import { ChatCircle, PencilSimple, Trash } from "@phosphor-icons/react";
import type { AdminNote } from "@/lib/admin/notes";
import {
  deleteNoteAction,
  deleteReplyAction,
  toggleNoteCheckedAction,
  updateNoteAction,
  updateReplyAction,
} from "./actions";
import InlineEditor from "./InlineEditor";
import ReplyComposer from "./ReplyComposer";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassCard, glassTone } from "../../glass";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoteCard({
  note,
  viewerId,
}: {
  note: AdminNote;
  /** null when the viewer is on the legacy shared login (no real
   * account) — compose/edit/delete/reply/check controls all disappear. */
  viewerId: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();

  const isAuthor = viewerId !== null && viewerId === note.authorId;
  const isChecked = viewerId !== null && note.checkedBy.some((c) => c.userId === viewerId);

  function toggleChecked() {
    startTransition(() => toggleNoteCheckedAction(note.id, !isChecked));
  }

  function deleteNote() {
    if (!confirm("Delete this note? You can restore it from Recently deleted.")) return;
    startTransition(async () => {
      await deleteNoteAction(note.id);
      showToast("Note deleted");
    });
  }

  function deleteReply(replyId: string) {
    startTransition(() => deleteReplyAction(replyId));
  }

  return (
    <div className={`p-4 ${glassCard}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.authorName}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formatDateTime(note.createdAt)}
            {note.updatedAt && " · (edited)"}
          </p>
        </div>
        {isAuthor && !editing && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit note"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <PencilSimple size={14} />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={deleteNote}
              aria-label="Delete note"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <InlineEditor
          action={updateNoteAction.bind(null, note.id)}
          initialBody={note.body}
          onDone={() => setEditing(false)}
        />
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{note.body}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {viewerId && (
          <button
            type="button"
            disabled={pending}
            onClick={toggleChecked}
            className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
              isChecked ? glassTone.success : glassTone.neutral
            }`}
          >
            {isChecked ? "Checked ✓ — click to undo" : "Mark as checked"}
          </button>
        )}
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {note.checkedBy.length === 0
            ? "No one has checked this yet"
            : `Checked by: ${note.checkedBy.map((c) => c.name).join(", ")}`}
        </span>
      </div>

      {note.replies.length > 0 && (
        <ul className="mt-3 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
          {note.replies.map((r) => {
            const replyIsAuthor = viewerId !== null && viewerId === r.authorId;
            return (
              <li key={r.id} className="border-s-2 border-slate-200 ps-3 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{r.authorName}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {formatDateTime(r.createdAt)}
                      {r.updatedAt && " · (edited)"}
                    </p>
                  </div>
                  {replyIsAuthor && editingReplyId !== r.id && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingReplyId(r.id)}
                        aria-label="Edit reply"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <PencilSimple size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => deleteReply(r.id)}
                        aria-label="Delete reply"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {editingReplyId === r.id ? (
                  <InlineEditor
                    action={updateReplyAction.bind(null, r.id)}
                    initialBody={r.body}
                    onDone={() => setEditingReplyId(null)}
                    compact
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{r.body}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {viewerId &&
        (replying ? (
          <ReplyComposer noteId={note.id} />
        ) : (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="mt-3 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ChatCircle size={14} />
            Reply
          </button>
        ))}
    </div>
  );
}
