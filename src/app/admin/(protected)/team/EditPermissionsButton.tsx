"use client";

import { useState } from "react";
import { LockKey } from "@phosphor-icons/react";
import Modal from "../components/Modal";
import { updateUserPermissionsAction } from "./actions";
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/admin/permissions-shared";
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${glassButtonSecondary}`}
      >
        <LockKey size={14} aria-hidden="true" />
        Edit access
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`${name}'s access`}>
        <form
          action={async (formData) => {
            await updateUserPermissionsAction(userId, formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose which sections {name} can see and change. Nothing checked means no access
            beyond the dashboard.
          </p>
          <div className="flex flex-wrap gap-2">
            {PERMISSIONS.map((p) => (
              <label
                key={p}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white dark:border-slate-700 dark:has-[:checked]:border-slate-100 dark:has-[:checked]:bg-slate-100 dark:has-[:checked]:text-slate-900"
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={p}
                  defaultChecked={permissions.includes(p)}
                  className="sr-only"
                />
                {PERMISSION_LABELS[p]}
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
