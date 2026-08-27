"use client";

import { useActionState } from "react";
import { verifyLogin } from "./actions";

export default function VerifyForm() {
  const [state, formAction, pending] = useActionState(verifyLogin, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="code" className="mb-2 block text-sm font-medium text-slate-700">
          6-digit code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          autoComplete="one-time-code"
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-center text-lg tracking-[0.4em] outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      <div aria-live="polite">
        {state?.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify and sign in"}
      </button>
    </form>
  );
}
