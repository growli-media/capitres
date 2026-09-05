"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import {
  CaretDown,
  CaretUp,
  DotsSixVertical,
  Plus,
  Trash,
  UploadSimple,
  VideoCamera,
} from "@phosphor-icons/react";
import type { AdminCollectionRow } from "@/lib/admin/collections";
import { createCollectionAction, updateCollectionAction, type FormState } from "./actions";
import { useActionToast } from "../components/useActionToast";
import ImageCropModal from "../components/ImageCropModal";
import { glassInput, glassTextarea, glassButtonPrimary, glassButtonSecondary, glassTone } from "../../glass";

interface ImageRow {
  id: number;
  url: string;
  altEn: string;
  altAr: string;
  altKu: string;
}

let rowIdSeq = 0;
function nextRowId() {
  rowIdSeq += 1;
  return rowIdSeq;
}

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
const textareaClass = glassTextarea;

export default function CollectionForm({
  mode,
  collection,
  nextSortOrder = 0,
}: {
  mode: "create" | "edit";
  collection?: AdminCollectionRow;
  /** New collections append to the end of the drag-ordered list —
   * only used in create mode, computed by the caller. */
  nextSortOrder?: number;
}) {
  const boundAction =
    mode === "edit" && collection
      ? updateCollectionAction.bind(null, collection.slug)
      : createCollectionAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(boundAction, {});
  useActionToast(pending, state.error, "Collection saved");

  const [images, setImages] = useState<ImageRow[]>(() =>
    collection && collection.heroImages.length > 0
      ? collection.heroImages.map((img) => ({
          id: nextRowId(),
          url: img.url,
          altEn: img.altEn,
          altAr: img.altAr,
          altKu: img.altKu,
        }))
      : [{ id: nextRowId(), url: "", altEn: "", altAr: "", altKu: "" }],
  );
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<{ id: number; file: File }[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [addDragOver, setAddDragOver] = useState(false);
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const [videoUrl, setVideoUrl] = useState(collection?.videoUrl ?? "");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function updateImage(id: number, patch: Partial<ImageRow>) {
    setImages((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addImage() {
    setImages((rows) => [...rows, { id: nextRowId(), url: "", altEn: "", altAr: "", altKu: "" }]);
  }
  function removeImage(id: number) {
    setImages((rows) => rows.filter((r) => r.id !== id));
  }
  function moveImage(from: number, to: number) {
    setImages((rows) => {
      if (to < 0 || to >= rows.length || from === to) return rows;
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  /** Every picked/dropped photo goes through the crop modal before it
   * uploads — queued so dropping several files at once still crops them
   * one at a time instead of stacking modals. */
  function queueCrop(id: number, file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("That doesn't look like an image file.");
      return;
    }
    setUploadError(null);
    setCropQueue((q) => [...q, { id, file }]);
  }

  /** Upload goes straight from the browser to Blob storage (not a Server
   * Action) — Vercel Serverless Functions cap request bodies around
   * 4.5MB regardless of Next.js config, and an unresized marketing photo
   * easily lands above that. Bypassing the server entirely, the same way
   * the video upload below already does, removes that ceiling. */
  async function uploadBlob(id: number, blob: Blob, filename: string) {
    setUploadingId(id);
    setUploadError(null);
    try {
      const result = await upload(filename, blob, {
        access: "public",
        handleUploadUrl: "/admin/blob-upload",
      });
      updateImage(id, { url: result.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingId(null);
    }
  }

  function handleCropApply(blob: Blob, filename: string) {
    const target = cropQueue[0];
    setCropQueue((q) => q.slice(1));
    if (target) uploadBlob(target.id, blob, filename);
  }

  function handleCropCancel() {
    setCropQueue((q) => q.slice(1));
  }

  function handleFileChange(id: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) queueCrop(id, file);
    e.target.value = "";
  }

  /** A drop on a photo row: an external image file uploads into that row;
   * an internal drag (a row being reordered) drops it into this slot. */
  function handleRowDrop(e: React.DragEvent, id: number, index: number) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      queueCrop(id, file);
    } else if (dragIndex !== null) {
      moveImage(dragIndex, index);
    }
    setDragIndex(null);
    setDropIndex(null);
  }

  /** Dropping image files onto the "add" zone appends them as new photos. */
  function handleAddDrop(e: React.DragEvent) {
    e.preventDefault();
    setAddDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    for (const file of files) {
      const id = nextRowId();
      setImages((rows) => [...rows, { id, url: "", altEn: "", altAr: "", altKu: "" }]);
      queueCrop(id, file);
    }
  }

  /**
   * Video goes straight from the browser to Blob storage via the client-
   * upload flow (upload() + /admin/blob-upload issuing a short-lived
   * token) — NOT the same Server Action used for photos. Vercel Serverless
   * Functions cap request bodies around 4.5MB regardless of Next.js
   * config, so a real video clip has to bypass this app's server
   * entirely, not just raise a body-size limit that wouldn't help anyway.
   */
  async function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setVideoError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/admin/blob-upload",
      });
      setVideoUrl(blob.url);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Video upload failed.");
    } finally {
      setVideoUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-8">
      <ImageCropModal
        file={cropQueue[0]?.file ?? null}
        defaultAspect={16 / 9}
        onApply={handleCropApply}
        onCancel={handleCropCancel}
      />
      {/* Photos */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Photos</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          The first photo (marked <span className="font-semibold text-slate-500 dark:text-slate-400">Main</span>)
          is the one shown in listings elsewhere on the site, and behind the video (below) while it
          loads if you set one. Add more than one and they&rsquo;ll auto-rotate on the collection
          page when there&rsquo;s no video. Drag the handle{" "}
          <DotsSixVertical size={12} className="inline align-middle" aria-hidden="true" /> or
          use the arrows to reorder, and drop an image onto a photo to replace it. Alt text is
          optional — it falls back to the collection&rsquo;s title if left blank.
        </p>
        <div className="space-y-4">
          {images.map((row, i) => (
            <div
              key={row.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDropIndex(i);
              }}
              onDragLeave={() => setDropIndex((d) => (d === i ? null : d))}
              onDrop={(e) => handleRowDrop(e, row.id, i)}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                dragIndex === i ? "opacity-40" : ""
              } ${
                dropIndex === i && dragIndex !== null && dragIndex !== i
                  ? "border-slate-900 bg-slate-50 dark:border-slate-400 dark:bg-slate-900"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Reorder controls */}
              <div className="flex flex-col items-center gap-0.5 pt-1 text-slate-300">
                <button
                  type="button"
                  onClick={() => moveImage(i, i - 1)}
                  disabled={i === 0}
                  aria-label="Move photo up"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-400"
                >
                  <CaretUp size={14} />
                </button>
                <span
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDropIndex(null);
                  }}
                  aria-label="Drag to reorder"
                  className="cursor-grab text-slate-400 transition-colors hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:hover:text-slate-400"
                >
                  <DotsSixVertical size={18} />
                </span>
                <button
                  type="button"
                  onClick={() => moveImage(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move photo down"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-400"
                >
                  <CaretDown size={14} />
                </button>
              </div>

              {/* Thumbnail (also a drop target for a replacement image) */}
              <div className="relative h-32 w-52 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                {row.url ? (
                  <Image src={row.url} alt="" fill sizes="208px" className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-slate-400 dark:text-slate-500">
                    Drop image here or upload
                  </div>
                )}
                {i === 0 && (
                  <span className="absolute start-1 top-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Main
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current.get(row.id)?.click()}
                    disabled={uploadingId === row.id}
                    className={`flex h-10 cursor-pointer items-center gap-2 px-3.5 text-sm font-medium text-slate-700 disabled:opacity-60 dark:text-slate-300 ${glassButtonSecondary}`}
                  >
                    <UploadSimple size={16} aria-hidden="true" />
                    {uploadingId === row.id ? "Uploading…" : "Upload photo"}
                  </button>
                  <input
                    ref={(el) => {
                      if (el) fileInputRefs.current.set(row.id, el);
                      else fileInputRefs.current.delete(row.id);
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => handleFileChange(row.id, e)}
                  />
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(row.id)}
                      aria-label="Remove photo"
                      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash size={15} />
                    </button>
                  )}
                </div>
                <Field label="Or paste an image URL">
                  <input
                    type="text"
                    name="heroImageUrl"
                    value={row.url}
                    onChange={(e) => updateImage(row.id, { url: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Alt text (EN, optional)">
                    <input
                      type="text"
                      name="heroImageAltEn"
                      value={row.altEn}
                      onChange={(e) => updateImage(row.id, { altEn: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Alt text (AR, optional)">
                    <input
                      type="text"
                      name="heroImageAltAr"
                      dir="rtl"
                      value={row.altAr}
                      onChange={(e) => updateImage(row.id, { altAr: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Alt text (KU, optional)">
                    <input
                      type="text"
                      name="heroImageAltKu"
                      dir="rtl"
                      value={row.altKu}
                      onChange={(e) => updateImage(row.id, { altKu: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
          {uploadError && <p className="text-xs text-amber-700 dark:text-amber-300">{uploadError}</p>}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setAddDragOver(true);
            }}
            onDragLeave={() => setAddDragOver(false)}
            onDrop={handleAddDrop}
            className={`flex items-center gap-2 rounded-lg border border-dashed px-3.5 py-2.5 transition-colors ${
              addDragOver ? "border-slate-900 bg-slate-50 dark:border-slate-400 dark:bg-slate-900" : "border-slate-300 dark:border-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={addImage}
              className="flex h-8 cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <Plus size={14} aria-hidden="true" />
              Add another photo
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500">or drag images here</span>
          </div>
        </div>
      </section>

      {/* Video */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Video</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          Optional. When set, the video takes over the collection&rsquo;s own page — shown alone,
          never layered with the photo — and customers can play or pause it. The photo above is
          still what shows in the collections list, nav, and homepage, and while the video loads.
          Max 80MB; compress longer clips first.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={videoUploading}
            className={`flex h-10 cursor-pointer items-center gap-2 px-3.5 text-sm font-medium text-slate-700 disabled:opacity-60 dark:text-slate-300 ${glassButtonSecondary}`}
          >
            <VideoCamera size={16} aria-hidden="true" />
            {videoUploading ? "Uploading…" : "Upload video"}
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleVideoFileChange}
          />
          {videoUrl && (
            <button
              type="button"
              onClick={() => setVideoUrl("")}
              className="text-xs font-medium text-slate-500 underline decoration-dotted hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            >
              Remove video
            </button>
          )}
        </div>
        {videoError && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{videoError}</p>}
        {videoUrl && (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            className="mt-3 h-40 w-auto max-w-full rounded-lg border border-slate-200 bg-black dark:border-slate-800"
          />
        )}
        <div className="mt-3">
          <Field label="Or paste a video URL">
            <input
              type="text"
              name="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Title */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Title</h2>
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
            <span className="text-sm text-slate-400 dark:text-slate-500">/collections/</span>
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
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Tagline</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">Short line shown under the title on the collection page.</p>
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
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Description</h2>
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

      {/* Text alignment */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Text alignment</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          How the title, tagline and description sit on the collection page — set independently
          per language, since a language&rsquo;s natural direction isn&rsquo;t always what you
          want.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="English">
            <select
              name="textAlignEn"
              defaultValue={collection?.textAlignEn ?? "left"}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>
          <Field label="Arabic">
            <select
              name="textAlignAr"
              defaultValue={collection?.textAlignAr ?? "right"}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>
          <Field label="Kurdish">
            <select
              name="textAlignKu"
              defaultValue={collection?.textAlignKu ?? "right"}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Story credit */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Story credit</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          Both optional, independent of each other — set either, both, or neither.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Published date" hint="Leave blank to not show a date.">
            <input
              type="date"
              name="publishedDate"
              defaultValue={collection?.publishedDate ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Published where" hint="e.g. a magazine or event name — leave blank to skip.">
            <input
              type="text"
              name="publishedWhere"
              defaultValue={collection?.publishedWhere ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Theme — display order is set by dragging rows on the collections
          list page now, not typed here; this hidden field just carries
          the existing value through unchanged on every save. */}
      <section className="max-w-xs">
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
      </section>
      <input type="hidden" name="sortOrder" value={collection?.sortOrder ?? nextSortOrder} />

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
          {pending ? "Saving…" : mode === "create" ? "Create collection" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
