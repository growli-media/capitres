"use client";

import { useActionState, useState } from "react";
import { CrownSimple } from "@phosphor-icons/react";
import Modal from "../components/Modal";
import { transferOwnershipAction } from "./actions";
import { glassButtonSecondary, glassButtonPrimary, glassInput } from "../../glass";

/** Strict-owner-only (the caller renders this component only when
 * currentUser.isOwner is true — see team/page.tsx). Transferring hands
 * off the one thing full_access deliberately doesn't grant: the ability
 * to toggle full_access itself and to transfer ownership again. */
export default function TransferOwnershipButton({
  eligibleUsers,
}: {
  eligibleUsers: { id: string; name: string; email: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(transferOwnershipAction, undefined);
  const [selectedId, setSelectedId] = useState(eligibleUsers[0]?.id ?? "");
  const selected = eligibleUsers.find((u) => u.id === selectedId);

  if (eligibleUsers.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mt-3 flex h-10 items-center gap-2 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 ${glassButtonSecondary}`}
      >
        <CrownSimple size={16} aria-hidden="true" />
        Transfer ownership
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Transfer ownership">
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="targetUserId" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              New owner
            </label>
            <select
              id="targetUserId"
              name="targetUserId"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={`h-10 w-full px-3 ${glassInput}`}
            >
              {eligibleUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
          </div>
          <p className="rounded-lg bg-amber-50/80 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            You will no longer be the owner.{" "}
            <strong>{selected?.name ?? "They"}</strong> will become the owner and will be able to
            manage the whole team, including editing your own access from then on.
          </p>
          <div aria-live="polite">
            {state?.error && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {state.error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${glassButtonPrimary}`}
            >
              {pending ? "Transferring…" : "Yes, transfer ownership"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
