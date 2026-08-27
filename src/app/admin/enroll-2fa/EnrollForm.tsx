"use client";

import { useActionState } from "react";
import { verifyEnrollment } from "./actions";

export default function EnrollForm({
  qrDataUrl,
  secret,
}: {
  qrDataUrl: string;
  secret: string;
}) {
  const [state, formAction, pending] = useActionState(verifyEnrollment, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex justify-center">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URI, next/image can't optimize it */}
          <img src={qrDataUrl} alt="Scan with your authenticator app" width={200} height={200} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-slate-500">Can&rsquo;t scan it?</p>
        <code className="block break-all rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
          {secret}
        </code>
        <p className="mt-1 text-xs text-slate-400">Enter this key manually in your authenticator app.</p>
      </div>

      <input type="hidden" name="secret" value={secret} />

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
        {pending ? "Verifying…" : "Confirm and finish setup"}
      </button>
    </form>
  );
}
