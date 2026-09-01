"use client";

import { useState } from "react";
import { LockKey } from "@phosphor-icons/react";
import Modal from "../components/Modal";
import { updateUserPermissionsAction } from "./actions";
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/admin/permissions-shared";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassButtonPrimary, glassButtonSecondary } from "../../glass";

/** Owner-only control (the row this renders in is already gated on
 * !user.isOwner in team/page.tsx). One checkbox per grantable permission
 * — same has-[:checked] chip pattern ProductForm.tsx uses for
 * collections, so this reads as a familiar control rather than a new
 * one. */
export default function EditPermissionsButton({
  userId,
  name,
  permissions,
}: {
  userId: string;
  name: string;
  permissions: Permission[];
}) {
  const [open, setOpen] = useState(false);
  const showToast = useAdminToast();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-slate-700 dark:text-slate-300 ${glassButtonSecondary}`}
      >
        <LockKey size={12} aria-hidden="true" className="text-slate-700 dark:text-slate-300" />
        Edit access
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`${name}'s access`}>
        <form
          action={async (formData) => {
            await updateUserPermissionsAction(userId, formData);
            setOpen(false);
            showToast(`Access updated for ${name}`);
          }}
          className="space-y-4"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose which sections {name} can see and change. Nothing checked means no access
            beyond the dashboard.
          </p>
          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-300 dark:divide-slate-800 dark:border-slate-700">
            {PERMISSIONS.map((p) => (
              <label
                key={p}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-sm text-slate-700 transition-colors has-[:checked]:bg-slate-50 dark:text-slate-300 dark:has-[:checked]:bg-slate-800/60"
              >
                {PERMISSION_LABELS[p]}
                <input
                  type="checkbox"
                  name="permissions"
                  value={p}
                  defaultChecked={permissions.includes(p)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-slate-100"
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            className={`h-10 w-full text-sm font-semibold ${glassButtonPrimary}`}
          >
            Save access
          </button>
        </form>
      </Modal>
    </>
  );
}
