"use client";

import { useActionState } from "react";
import { addEmailAction } from "./actions";
import { glassInput, glassButtonPrimary } from "../../glass";

export default function AddEmailForm() {
  const [state, formAction, pending] = useActionState(addEmailAction, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Approve an email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="name@example.com"
          className={`h-10 w-full px-3 ${glassInput}`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`h-10 shrink-0 cursor-pointer px-4 text-sm font-semibold disabled:cursor-not-allowed ${glassButtonPrimary}`}
      >
        {pending ? "Adding…" : "Approve"}
      </button>
      <div aria-live="polite" className="w-full">
        {state?.error && (
          <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
