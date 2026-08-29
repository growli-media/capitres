"use client";

import { useActionState } from "react";
import type { AdminCategoryRow } from "@/lib/admin/categories";
import { createCategoryAction, updateCategoryAction, type FormState } from "./actions";
import { glassInput, glassButtonPrimary, glassTone } from "../../glass";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass = `h-10 w-full px-3 ${glassInput}`;

export default function CategoryForm({
  mode,
  category,
}: {
  mode: "create" | "edit";
  category?: AdminCategoryRow;
}) {
  const boundAction =
    mode === "edit" && category
      ? updateCategoryAction.bind(null, category.slug)
      : createCategoryAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(boundAction, {});

  return (
    <form action={formAction} className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Name</h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="English">
            <input type="text" name="titleEn" required defaultValue={category?.titleEn} className={inputClass} />
          </Field>
          <Field label="Arabic">
            <input
              type="text"
              name="titleAr"
              dir="rtl"
              required
              defaultValue={category?.titleAr}
              className={inputClass}
            />
          </Field>
          <Field label="Kurdish">
            <input
              type="text"
              name="titleKu"
              dir="rtl"
              required
              defaultValue={category?.titleKu}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section>
        <Field
          label="URL"
          hint={
            mode === "edit"
              ? "Locked after creation so shared links keep working."
              : "Leave blank to generate from the English name."
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 dark:text-slate-500">/shop?category=</span>
            <input
              type="text"
              name="slug"
              defaultValue={category?.slug}
              disabled={mode === "edit"}
              placeholder="auto-generated-from-name"
              className={`${inputClass} max-w-xs`}
            />
          </div>
        </Field>
      </section>

      <section className="max-w-xs">
        <Field label="Sort order" hint="Lower numbers show first in the shop menu.">
          <input
            type="number"
            name="sortOrder"
            step={1}
            defaultValue={category?.sortOrder ?? 0}
            className={inputClass}
          />
        </Field>
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
          {pending ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
