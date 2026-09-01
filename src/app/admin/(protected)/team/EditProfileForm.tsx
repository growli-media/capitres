"use client";

import { useState, useTransition } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import Modal from "../components/Modal";
import { updateOwnProfileAction, updateUserProfileAction } from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassInput, glassButtonPrimary } from "../../glass";

const inputClass = `h-10 w-full px-3 ${glassInput}`;
const labelClass = "mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400";

export default function EditProfileForm({
  firstName,
  lastName,
  phone,
  role,
  company,
  email,
  targetUserId,
  targetName,
}: {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  email: string;
  /** Set when an owner/full-control viewer is editing a teammate's
   * profile instead of their own — routes to updateUserProfileAction and
   * relabels the trigger/modal accordingly. */
  targetUserId?: string;
  targetName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = targetUserId
        ? await updateUserProfileAction(targetUserId, undefined, formData)
        : await updateOwnProfileAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setOpen(false);
        showToast("Profile updated");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(undefined);
        }}
        className="flex items-center gap-1 rounded-full border border-slate-300/70 bg-white/50 px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-slate-700 backdrop-blur-md transition-colors hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800/70"
      >
        <PencilSimple size={12} />
        Edit profile
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={targetUserId ? `Edit ${targetName}'s profile` : "Edit your profile"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className={labelClass}>
                First name
              </label>
              <input id="firstName" name="firstName" defaultValue={firstName ?? ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>
                Last name
              </label>
              <input id="lastName" name="lastName" defaultValue={lastName ?? ""} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="role" className={labelClass}>
              Role
            </label>
            <input
              id="role"
              name="role"
              defaultValue={role ?? ""}
              placeholder="e.g. Store Manager"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="company" className={labelClass}>
              Company
            </label>
            <input
              id="company"
              name="company"
              defaultValue={company ?? ""}
              placeholder="e.g. Acme Studio — leave blank if you're part of our Capitres team"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input id="email" name="email" type="email" required defaultValue={email} className={inputClass} />
          </div>
          <div aria-live="polite">
            {error && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
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
              className={`px-4 py-2 text-sm font-semibold ${glassButtonPrimary}`}
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
