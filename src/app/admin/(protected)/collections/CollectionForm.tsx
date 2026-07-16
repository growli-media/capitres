"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { UploadSimple } from "@phosphor-icons/react";
import type { AdminCollectionRow } from "@/lib/admin/collections";
import { createCollectionAction, updateCollectionAction, type FormState } from "./actions";
import { uploadProductImage } from "../products/upload-action";

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
const textareaClass =
  "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

export default function CollectionForm({
  mode,
  collection,
}: {
  mode: "create" | "edit";
  collection?: AdminCollectionRow;
}) {
  const boundAction =
    mode === "edit" && collection
      ? updateCollectionAction.bind(null, collection.slug)
      : createCollectionAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(boundAction, {});

  const [heroUrl, setHeroUrl] = useState(collection?.heroImageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadProductImage(fd);
    setUploading(false);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) setHeroUrl(result.url);
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Cover photo */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Cover photo</h2>
        <div className="flex items-start gap-5">
          <div className="relative h-32 w-52 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            {heroUrl && (
              <Image src={heroUrl} alt="" fill sizes="208px" className="object-cover" unoptimized />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                <UploadSimple size={16} aria-hidden="true" />
                {uploading ? "Uploading…" : "Upload photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {uploadError && <p className="text-xs text-amber-700">{uploadError}</p>}
            <Field label="Or paste an image URL">
              <input
                type="text"
                name="heroImageUrl"
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Alt text (EN)">
                <input
                  type="text"
                  name="heroImageAltEn"
                  defaultValue={collection?.heroImageAltEn}
                  className={inputClass}
                />
              </Field>
              <Field label="Alt text (AR)">
                <input
                  type="text"
                  name="heroImageAltAr"
                  dir="rtl"
                  defaultValue={collection?.heroImageAltAr}
                  className={inputClass}
                />
              </Field>
              <Field label="Alt text (KU)">
                <input
                  type="text"
                  name="heroImageAltKu"
                  dir="rtl"
                  defaultValue={collection?.heroImageAltKu}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>
      </section>

      {/* Title */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Title</h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="English">
            <input type="text" name="titleEn" required defaultValue={collection?.titleEn} className={inputClass} />
          </Field>
          <Field label="Arabic">
            <input
              type="text"
              name="titleAr"
              dir="rtl"
              required
              defaultValue={collection?.titleAr}
              className={inputClass}
            />
          </Field>
          <Field label="Kurdish">
            <input
              type="text"
              name="titleKu"
              dir="rtl"
              required
              defaultValue={collection?.titleKu}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* URL slug */}
      <section>
        <Field
          label="URL"
          hint={
            mode === "edit"
              ? "Locked after creation so shared links keep working."
              : "Leave blank to generate from the English title."
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">/collections/</span>
            <input
              type="text"
              name="slug"
              defaultValue={collection?.slug}
              disabled={mode === "edit"}
              placeholder="auto-generated-from-title"
              className={`${inputClass} max-w-xs`}
            />
          </div>
        </Field>
      </section>

      {/* Tagline */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Tagline</h2>
        <p className="mb-3 text-xs text-slate-400">Short line shown under the title on the collection page.</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="English">
            <input type="text" name="taglineEn" required defaultValue={collection?.taglineEn} className={inputClass} />
          </Field>
          <Field label="Arabic">
            <input
              type="text"
              name="taglineAr"
              dir="rtl"
              required
              defaultValue={collection?.taglineAr}
              className={inputClass}
            />
          </Field>
          <Field label="Kurdish">
            <input
              type="text"
              name="taglineKu"
              dir="rtl"
              required
              defaultValue={collection?.taglineKu}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Description */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Description</h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="English">
            <textarea
              name="descriptionEn"
              required
              rows={4}
              defaultValue={collection?.descriptionEn}
              className={textareaClass}
            />
          </Field>
          <Field label="Arabic">
            <textarea
              name="descriptionAr"
              dir="rtl"
              required
              rows={4}
              defaultValue={collection?.descriptionAr}
              className={textareaClass}
            />
          </Field>
          <Field label="Kurdish">
            <textarea
              name="descriptionKu"
              dir="rtl"
              required
              rows={4}
              defaultValue={collection?.descriptionKu}
              className={textareaClass}
            />
          </Field>
        </div>
      </section>

      {/* Theme / order */}
      <section className="grid grid-cols-2 gap-3">
        <Field label="Theme" hint="Controls text/badge contrast over the cover photo.">
          <select
            name="theme"
            defaultValue={collection?.theme ?? "light"}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
        <Field label="Sort order" hint="Lower numbers show first in the collections list.">
          <input
            type="number"
            name="sortOrder"
            step={1}
            defaultValue={collection?.sortOrder ?? 0}
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
          {pending ? "Saving…" : mode === "create" ? "Create collection" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
