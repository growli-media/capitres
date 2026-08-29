"use client";

import { useState, useTransition } from "react";
import { Note } from "@phosphor-icons/react";
import Modal from "../components/Modal";
import { updateOrderNoteAction } from "./actions";
import { glassTextarea, glassButtonPrimary } from "../../glass";

export default function NoteButton({
  orderRef,
  initialNote,
}: {
  orderRef: string;
  initialNote: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();
  const hasNote = !!initialNote;

  function save() {
    startTransition(async () => {
      await updateOrderNoteAction(orderRef, note);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={hasNote ? "View or edit note" : "Add note"}
        title={hasNote ? "View or edit note" : "Add note"}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/60 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-slate-100 ${
          hasNote ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
        }`}
      >
        <Note size={16} weight={hasNote ? "fill" : "regular"} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Note — ${orderRef}`}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          maxLength={2000}
          autoFocus
          placeholder="Write a note for the team about this order…"
          className={glassTextarea}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className={`px-4 py-2 text-sm font-semibold ${glassButtonPrimary}`}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </>
  );
}
