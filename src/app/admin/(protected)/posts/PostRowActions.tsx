"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import { deletePostAction, togglePostPublishedAction } from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassIconButton } from "../../glass";

export default function PostRowActions({
  slug,
  published,
}: {
  slug: string;
  published: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();

  return (
    <div className="relative flex items-center justify-end gap-1">
      <Link
        href={`/admin/posts/${slug}/edit`}
        aria-label="Edit post"
        className={`h-9 w-9 ${glassIconButton}`}
      >
        <PencilSimple size={16} />
      </Link>
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="More actions"
          aria-expanded={open}
          className={`h-9 w-9 ${glassIconButton}`}
        >
          <DotsThreeVertical size={18} />
        </button>
        {open && (
          <div
            className="absolute end-0 top-10 z-10 w-48 rounded-lg border border-white/40 bg-white/90 py-1 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/90"
            onMouseLeave={() => setOpen(false)}
          >
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const next = !published;
                startTransition(async () => {
                  await togglePostPublishedAction(slug, next);
                  showToast(next ? "Post published" : "Post unpublished");
                });
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {published ? "Unpublish (hide from Journal)" : "Publish (show on Journal)"}
            </button>
            {confirmingDelete ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => deletePostAction(slug))}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 disabled:opacity-50"
              >
                <Trash size={14} />
                Confirm permanent delete
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <Trash size={14} />
                Delete permanently
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
