"use client";

import { useState, useTransition } from "react";
import { CaretDown, CaretUp, ArrowCounterClockwise } from "@phosphor-icons/react";
import type { AdminNote } from "@/lib/admin/notes";
import { restoreNoteAction } from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassCard, glassButtonSecondary } from "../../glass";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Your own soft-deleted notes only (restore is author-only, same as
 * delete) — mirrors Orders' "Recently deleted" panel/undo pattern. */
export default function RecentlyDeletedNotes({ notes }: { notes: AdminNote[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();

  function restore(id: string) {
    startTransition(async () => {
      await restoreNoteAction(id);
      showToast("Note restored");
    });
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        {open ? <CaretUp size={14} /> : <CaretDown size={14} />}
        Recently deleted ({notes.length})
      </button>
      {open && (
        <ul className={`mt-3 divide-y divide-slate-100 overflow-hidden dark:divide-slate-800 ${glassCard}`}>
          {notes.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(n.createdAt)}</p>
                <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{n.body}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => restore(n.id)}
                className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 px-3 text-xs font-semibold disabled:opacity-50 ${glassButtonSecondary}`}
              >
                <ArrowCounterClockwise size={12} />
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
