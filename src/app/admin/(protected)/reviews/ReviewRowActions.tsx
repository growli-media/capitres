"use client";

import { useTransition } from "react";
import { Check, Trash, X } from "@phosphor-icons/react";
import { approveReviewAction, deleteReviewAction, unapproveReviewAction } from "./actions";
import { glassTone } from "../../glass";

export default function ReviewRowActions({
  id,
  approved,
}: {
  id: string;
  approved: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-1.5">
      {approved ? (
        <button
          type="button"
          onClick={() => startTransition(() => unapproveReviewAction(id))}
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
        >
          <X size={14} />
          Unpublish
        </button>
      ) : (
        <button
          type="button"
          onClick={() => startTransition(() => approveReviewAction(id))}
          disabled={pending}
          className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:hover:bg-emerald-950/70 ${glassTone.success}`}
        >
          <Check size={14} />
          Approve
        </button>
      )}
      <button
        type="button"
        onClick={() => startTransition(() => deleteReviewAction(id))}
        disabled={pending}
        aria-label="Delete review"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <Trash size={14} />
      </button>
    </div>
  );
}
