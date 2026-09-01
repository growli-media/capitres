"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { DotsThreeVertical, PencilSimple, TagSimple, Trash } from "@phosphor-icons/react";
import {
  deleteProductAction,
  markSoldOutAction,
  toggleArchivedAction,
} from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassIconButton } from "../../glass";

export default function ProductRowActions({
  id,
  archived,
}: {
  id: string;
  archived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();

  return (
    <div className="relative flex items-center justify-end gap-1">
      <Link
        href={`/admin/products/${id}/edit`}
        aria-label="Edit product"
        className={`h-9 w-9 ${glassIconButton}`}
      >
        <PencilSimple size={16} />
      </Link>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await markSoldOutAction(id);
            showToast("Marked as sold out");
          })
        }
        disabled={pending}
        className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100 disabled:opacity-50 sm:flex"
        title="Set every size's stock to 0"
      >
        <TagSimple size={14} />
        Sold out
      </button>
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
              onClick={() => {
                startTransition(async () => {
                  await markSoldOutAction(id);
                  showToast("Marked as sold out");
                });
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 sm:hidden dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Mark sold out
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !archived;
                startTransition(async () => {
                  await toggleArchivedAction(id, next);
                  showToast(next ? "Product archived" : "Product unarchived");
                });
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {archived ? "Unarchive (show in store)" : "Archive (hide from store)"}
            </button>
            {confirmingDelete ? (
              <button
                type="button"
                onClick={() => startTransition(() => deleteProductAction(id))}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
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
