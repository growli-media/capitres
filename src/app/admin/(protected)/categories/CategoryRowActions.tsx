"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import { deleteCategoryAction, toggleCategoryArchivedAction } from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";
import Popover from "../components/Popover";
import { glassIconButton } from "../../glass";

export default function CategoryRowActions({
  slug,
  archived,
  reserved,
}: {
  slug: string;
  archived: boolean;
  reserved: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();
  const triggerRef = useRef<HTMLButtonElement>(null);

  function onDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(slug);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/categories/${slug}/edit`}
        aria-label="Edit category"
        className={`h-9 w-9 ${glassIconButton}`}
      >
        <PencilSimple size={16} />
      </Link>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
        }}
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
        className="w-56 rounded-xl border py-1"
      >
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const next = !archived;
            startTransition(async () => {
              await toggleCategoryArchivedAction(slug, next);
              showToast(next ? "Category archived" : "Category unarchived");
            });
            setOpen(false);
          }}
          className="flex w-full cursor-pointer items-center px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {archived ? "Unarchive (show in shop)" : "Archive (hide from shop)"}
        </button>
        {!reserved &&
          (confirmingDelete ? (
            <button
              type="button"
              disabled={pending}
              onClick={onDelete}
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
          ))}
        {error && (
          <p className="px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </Popover>
    </div>
  );
}
