"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestReset } from "./actions";
import { glassInput, glassButtonPrimary } from "../glass";

const inputClass = `h-11 w-full px-3.5 ${glassInput}`;

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestReset, undefined);

  if (state?.success) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-slate-600">
          If that email has an account, a 6-digit code is on its way. It
          expires in 10 minutes.
        </p>
        <Link
          href="/admin/reset-password"
          className={`flex h-11 w-full cursor-pointer items-center justify-center text-sm font-semibold ${glassButtonPrimary}`}
        >
          I have my code
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          className={inputClass}
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
        {pending ? "Sending…" : "Send reset code"}
      </button>

      <p className="text-center text-sm text-slate-500">
        <Link href="/admin/login" className="font-semibold text-slate-800 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
