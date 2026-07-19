"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  deleteCategoryAction,
  toggleCategoryArchivedAction,
} from "./actions";

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

  function onDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(slug);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="relative flex items-center justify-end gap-1">
      <Link
        href={`/admin/categories/${slug}/edit`}
        aria-label="Edit category"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <PencilSimple size={16} />
      </Link>
      <div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
          }}
          aria-label="More actions"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <DotsThreeVertical size={18} />
        </button>
        {open && (
          <div
            className="absolute end-0 top-10 z-10 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            onMouseLeave={() => setOpen(false)}
          >
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(() => toggleCategoryArchivedAction(slug, !archived));
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {archived ? "Unarchive (show in shop)" : "Archive (hide from shop)"}
            </button>
            {!reserved &&
              (confirmingDelete ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={onDelete}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash size={14} />
                  Confirm permanent delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash size={14} />
                  Delete permanently
                </button>
              ))}
            {error && (
              <p className="px-3 py-2 text-xs text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
