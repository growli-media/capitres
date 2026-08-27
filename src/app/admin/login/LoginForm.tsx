"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginLegacy, loginWithEmail } from "./actions";

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
const labelClass = "mb-2 block text-sm font-medium text-slate-700";

export default function LoginForm({ legacyAvailable }: { legacyAvailable: boolean }) {
  const [state, formAction, pending] = useActionState(loginWithEmail, undefined);
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyState, legacyFormAction, legacyPending] = useActionState(loginLegacy, undefined);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="email" className={labelClass}>
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

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link href="/admin/forgot-password" className="text-xs font-medium text-slate-500 hover:text-slate-800">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-sm text-slate-500">
          No account yet?{" "}
          <Link href="/admin/signup" className="font-semibold text-slate-800 hover:underline">
            Sign up
          </Link>
        </p>
      </form>

      {legacyAvailable && (
        <div className="border-t border-slate-100 pt-5">
          {!showLegacy ? (
            <button
              type="button"
              onClick={() => setShowLegacy(true)}
              className="w-full cursor-pointer text-center text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Setting up for the first time? Use the legacy admin password
            </button>
          ) : (
            <form action={legacyFormAction} className="space-y-4">
              <p className="text-xs text-slate-500">
                Bootstrap login — this stops working once the first account has
                signed up and completed two-factor setup.
              </p>
              <div>
                <label htmlFor="username" className={labelClass}>
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="legacy-password" className={labelClass}>
                  Password
                </label>
                <input
                  id="legacy-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
              <div aria-live="polite">
                {legacyState?.error && (
                  <p role="alert" className="text-sm font-medium text-red-600">
                    {legacyState.error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={legacyPending}
                className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {legacyPending ? "Signing in…" : "Sign in with legacy password"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
