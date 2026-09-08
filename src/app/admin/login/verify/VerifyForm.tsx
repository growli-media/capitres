"use client";

import { useActionState } from "react";
import { verifyLogin } from "./actions";
import { glassInput, glassButtonPrimary } from "../../glass";

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
          className={`h-11 w-full px-3.5 text-center text-lg tracking-[0.4em] ${glassInput}`}
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
        className={`flex h-11 w-full cursor-pointer items-center justify-center text-sm font-semibold disabled:cursor-not-allowed ${glassButtonPrimary}`}
      >
        {pending ? "Verifying…" : "Verify and sign in"}
      </button>
    </form>
  );
}
