"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "@phosphor-icons/react";
import type { OnboardingStep } from "@/lib/admin/onboarding";
import { glassCard } from "../../glass";

const DISMISSED_KEY = "capitres-admin-onboarding-dismissed";

export default function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: localStorage is a client-only API, unreadable during SSR
      setDismissed(localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      // Storage blocked — default to showing it (dismissed stays false-ish via the catch below not firing).
    }
  }, []);

  const allDone = steps.every((s) => s.done);
  if (dismissed || allDone) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private browsing / storage blocked — it'll just show again next visit.
    }
    setDismissed(true);
  }

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className={`relative mb-6 p-5 ${glassCard}`}>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute end-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        <X size={16} />
      </button>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Getting started — {doneCount}/{steps.length}
      </h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {steps.map((step) =>
          step.done ? (
            <div
              key={step.id}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check size={11} weight="bold" />
              </span>
              <span className="line-through">{step.label}</span>
            </div>
          ) : (
            <Link
              key={step.id}
              href={step.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
            >
              <span className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              {step.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
