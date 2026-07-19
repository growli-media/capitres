"use client";

import { useActionState } from "react";
import type { AdminCategoryRow } from "@/lib/admin/categories";
import { createCategoryAction, updateCategoryAction, type FormState } from "./actions";

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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:text-slate-500";

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
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Name</h2>
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
            <span className="text-sm text-slate-400">/shop?category=</span>
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
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 cursor-pointer items-center rounded-lg bg-slate-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
