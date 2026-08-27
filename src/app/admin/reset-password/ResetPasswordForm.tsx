"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "./actions";

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
const labelClass = "mb-2 block text-sm font-medium text-slate-700";

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" required autoFocus autoComplete="email" className={inputClass} />
      </div>

      <div>
        <label htmlFor="code" className={labelClass}>
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
          autoComplete="one-time-code"
          className={`${inputClass} text-center tracking-[0.4em]`}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-slate-400">At least 10 characters.</p>
      </div>

      <div>
        <label htmlFor="confirm" className={labelClass}>
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <p className="text-xs text-slate-400">
        Resetting your password also clears two-factor authentication —
        you&rsquo;ll set it up again with a new code on your next sign-in.
      </p>

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
        {pending ? "Resetting…" : "Reset password"}
      </button>

      <p className="text-center text-sm text-slate-500">
        <Link href="/admin/login" className="font-semibold text-slate-800 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
