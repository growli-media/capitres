"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  deleteCollectionAction,
  toggleCollectionArchivedAction,
} from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";
import Popover from "../components/Popover";
import { glassIconButton } from "../../glass";

export default function CollectionRowActions({
  slug,
  archived,
}: {
  slug: string;
  archived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/collections/${slug}/edit`}
        aria-label="Edit collection"
        className={`h-9 w-9 ${glassIconButton}`}
      >
        <PencilSimple size={16} />
      </Link>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        className={`h-9 w-9 ${glassIconButton}`}
      >
        <DotsThreeVertical size={18} />
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        className="w-48 rounded-xl border py-1"
      >
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const next = !archived;
            startTransition(async () => {
              await toggleCollectionArchivedAction(slug, next);
              showToast(next ? "Collection archived" : "Collection unarchived");
            });
            setOpen(false);
          }}
          className="flex w-full cursor-pointer items-center px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {archived ? "Unarchive (show in store)" : "Archive (hide from store)"}
        </button>
        {confirmingDelete ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => deleteCollectionAction(slug))}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
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
      </Popover>
    </div>
  );
}
