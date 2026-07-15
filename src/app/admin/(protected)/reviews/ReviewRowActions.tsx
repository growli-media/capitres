"use client";

import { useTransition } from "react";
import { Check, Trash, X } from "@phosphor-icons/react";
import { approveReviewAction, deleteReviewAction, unapproveReviewAction } from "./actions";

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
          className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        >
          <X size={14} />
          Unpublish
        </button>
      ) : (
        <button
          type="button"
          onClick={() => startTransition(() => approveReviewAction(id))}
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
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
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash size={14} />
      </button>
    </div>
  );
}
