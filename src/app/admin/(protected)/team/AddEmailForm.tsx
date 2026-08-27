"use client";

import { useActionState } from "react";
import { addEmailAction } from "./actions";

export default function AddEmailForm() {
  const [state, formAction, pending] = useActionState(addEmailAction, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-500">
          Approve an email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="name@example.com"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-10 shrink-0 cursor-pointer rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Adding…" : "Approve"}
      </button>
      <div aria-live="polite" className="w-full">
        {state?.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
