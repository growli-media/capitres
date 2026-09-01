"use client";

import { useState, useTransition } from "react";
import { ClockCounterClockwise, ArrowCounterClockwise, Trash } from "@phosphor-icons/react";
import Modal from "../components/Modal";
import { customerName, type Order } from "@/lib/orders/order-helpers";
import { formatIQD } from "@/lib/money";
import { getDeletedOrdersAction, restoreOrdersAction, hardDeleteOrdersAction } from "./actions";
import { glassButtonSecondary, glassButtonPrimary } from "../../glass";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** The Orders page's trash bin — orders soft-deleted in the last 60 days
 * (see RECENTLY_DELETED_DAYS in actions.ts), with Restore (undoes the
 * soft delete) or Delete forever (an actual row delete, confirmed
 * separately since it can't be undone). Loads its list lazily on open
 * rather than being kept in sync with OrdersView's own state — this is a
 * rarely-opened panel, not something that needs to react live to every
 * delete elsewhere on the page. */
export default function RecentlyDeletedPanel({ onRestored }: { onRestored: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmingForever, setConfirmingForever] = useState(false);
  const [isPending, startTransition] = useTransition();

  function openPanel() {
    setOpen(true);
    setSelected(new Set());
    setConfirmingForever(false);
    setLoading(true);
    startTransition(async () => {
      setOrders(await getDeletedOrdersAction());
      setLoading(false);
    });
  }

  function toggle(ref: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }

  function handleRestore() {
    const refs = Array.from(selected);
    startTransition(async () => {
      await restoreOrdersAction(refs);
      setOrders((prev) => prev.filter((o) => !refs.includes(o.ref)));
      setSelected(new Set());
      onRestored();
    });
  }

  function handleDeleteForever() {
    const refs = Array.from(selected);
    startTransition(async () => {
      await hardDeleteOrdersAction(refs);
      setOrders((prev) => prev.filter((o) => !refs.includes(o.ref)));
      setSelected(new Set());
      setConfirmingForever(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className={`mt-6 flex h-10 items-center gap-2 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 ${glassButtonSecondary}`}
      >
        <ClockCounterClockwise size={16} aria-hidden="true" />
        Recently deleted
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Recently deleted">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Orders deleted in the last 60 days. Restore them, or select some and delete them
          forever.
        </p>

        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nothing here.
            </p>
          ) : (
            orders.map((o) => (
              <label
                key={o.ref}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50 dark:border-slate-800 dark:has-[:checked]:border-slate-100 dark:has-[:checked]:bg-slate-800/60"
              >
                <input
                  type="checkbox"
                  checked={selected.has(o.ref)}
                  onChange={() => toggle(o.ref)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {customerName(o.customer) || o.ref}
                  </p>
                  <p className="font-mono text-xs text-slate-400 dark:text-slate-500">
                    {o.ref} — deleted {o.deletedAt ? formatDate(o.deletedAt) : "—"}
                  </p>
                </div>
                <span className="price shrink-0 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatIQD(o.totals.total, "en")}
                </span>
              </label>
            ))
          )}
        </div>

        {selected.size > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            {confirmingForever ? (
              <>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Delete {selected.size} order{selected.size === 1 ? "" : "s"} forever? This
                  can&rsquo;t be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingForever(false)}
                    className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteForever}
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Yes, delete forever
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isPending}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${glassButtonPrimary}`}
                >
                  <ArrowCounterClockwise size={15} />
                  Restore {selected.size}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingForever(true)}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <Trash size={15} />
                  Delete forever
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
