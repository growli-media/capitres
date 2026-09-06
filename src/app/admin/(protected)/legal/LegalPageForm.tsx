"use client";

import { useActionState } from "react";
import type { AdminLegalPageRow } from "@/lib/admin/legal-pages";
import { updateLegalPageAction, type FormState } from "./actions";
import { useActionToast } from "../components/useActionToast";
import { glassInput, glassTextarea, glassButtonPrimary, glassTone } from "../../glass";

const inputClass = `h-10 w-full px-3 ${glassInput}`;

export default function LegalPageForm({ page }: { page: AdminLegalPageRow }) {
  const boundAction = updateLegalPageAction.bind(null, page.slug);
  const [state, formAction, pending] = useActionState<FormState, FormData>(boundAction, {});
  useActionToast(pending, state.error, "Page saved");

  return (
    <form action={formAction} className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Title</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input type="text" name="titleEn" required defaultValue={page.titleEn} placeholder="English" className={inputClass} />
          <input type="text" name="titleAr" dir="rtl" required defaultValue={page.titleAr} placeholder="Arabic" className={inputClass} />
          <input type="text" name="titleKu" dir="rtl" required defaultValue={page.titleKu} placeholder="Kurdish" className={inputClass} />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Body</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          Plain text — separate paragraphs with a blank line. Start a line with{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">## </code> to make it a
          heading (e.g. for shipping&rsquo;s separate sections).
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <textarea name="bodyEn" required rows={16} defaultValue={page.bodyEn} placeholder="English" className={`${glassTextarea} font-mono text-xs`} />
          <textarea name="bodyAr" dir="rtl" required rows={16} defaultValue={page.bodyAr} placeholder="Arabic" className={`${glassTextarea} font-mono text-xs`} />
          <textarea name="bodyKu" dir="rtl" required rows={16} defaultValue={page.bodyKu} placeholder="Kurdish" className={`${glassTextarea} font-mono text-xs`} />
        </div>
      </section>

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className={`rounded-lg px-4 py-3 text-sm font-medium ${glassTone.danger}`}>
            {state.error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        <button
          type="submit"
          disabled={pending}
          className={`flex h-11 cursor-pointer items-center px-6 text-sm font-semibold disabled:cursor-not-allowed ${glassButtonPrimary}`}
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
