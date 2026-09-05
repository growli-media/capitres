"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import {
  CaretDown,
  CaretUp,
  ImageSquare,
  LinkSimple,
  Paragraph,
  Plus,
  Quotes,
  TextHOne,
  Trash,
  UploadSimple,
  VideoCamera,
} from "@phosphor-icons/react";
import type { AdminPostRow, AdminPostBlock } from "@/lib/admin/posts";
import { createPostAction, updatePostAction, type FormState } from "./actions";
import { useActionToast } from "../components/useActionToast";
import ImageCropModal from "../components/ImageCropModal";
import RelatedProductsPicker, { type PickableProduct } from "./RelatedProductsPicker";
import { glassInput, glassTextarea, glassButtonPrimary, glassButtonSecondary, glassTone } from "../../glass";

type Loc = { en: string; ar: string; ku: string };
const EMPTY_LOC: Loc = { en: "", ar: "", ku: "" };
type BlockType = "p" | "h2" | "quote" | "image" | "video" | "link";

interface BlockRow {
  id: number;
  type: BlockType;
  text: Loc;
  attribution: Loc;
  imageUrl: string;
  imageAlt: Loc;
  videoUrl: string;
  posterUrl: string;
  posterAlt: Loc;
  linkUrl: string;
  linkLabel: Loc;
}

let rowIdSeq = 0;
function nextRowId() {
  rowIdSeq += 1;
  return rowIdSeq;
}

function newBlock(type: BlockType): BlockRow {
  return {
    id: nextRowId(),
    type,
    text: { ...EMPTY_LOC },
    attribution: { ...EMPTY_LOC },
    imageUrl: "",
    imageAlt: { ...EMPTY_LOC },
    videoUrl: "",
    posterUrl: "",
    posterAlt: { ...EMPTY_LOC },
    linkUrl: "",
    linkLabel: { ...EMPTY_LOC },
  };
}

function blockFromAdmin(b: AdminPostBlock): BlockRow {
  const base = newBlock(b.type);
  switch (b.type) {
    case "p":
    case "h2":
      return { ...base, text: b.text };
    case "quote":
      return { ...base, text: b.text, attribution: b.attribution ?? { ...EMPTY_LOC } };
    case "image":
      return { ...base, imageUrl: b.image.url, imageAlt: b.image.alt };
    case "video":
      return {
        ...base,
        videoUrl: b.url,
        posterUrl: b.poster?.url ?? "",
        posterAlt: b.poster?.alt ?? { ...EMPTY_LOC },
      };
    case "link":
      return { ...base, linkUrl: b.url, linkLabel: b.label };
  }
}

function blockToPayload(b: BlockRow) {
  switch (b.type) {
    case "p":
    case "h2":
      return { type: b.type, text: b.text };
    case "quote":
      return {
        type: "quote",
        text: b.text,
        attribution: b.attribution.en || b.attribution.ar || b.attribution.ku ? b.attribution : undefined,
      };
    case "image":
      return { type: "image", image: { url: b.imageUrl, alt: b.imageAlt } };
    case "video":
      return {
        type: "video",
        url: b.videoUrl,
        poster: b.posterUrl ? { url: b.posterUrl, alt: b.posterAlt } : undefined,
      };
    case "link":
      return { type: "link", url: b.linkUrl, label: b.linkLabel };
  }
}

const BLOCK_LABELS: Record<BlockType, string> = {
  p: "Paragraph",
  h2: "Heading",
  quote: "Quote",
  image: "Photo",
  video: "Video",
  link: "Link",
};
const BLOCK_ICONS: Record<BlockType, typeof Paragraph> = {
  p: Paragraph,
  h2: TextHOne,
  quote: Quotes,
  image: ImageSquare,
  video: VideoCamera,
  link: LinkSimple,
};

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

/** The repeated EN/AR/KU triple — used both at the top level (title,
 * excerpt) and inside every block, so it's factored here rather than
 * inlined three times per block type. */
function LocaleFields({
  label,
  value,
  onChange,
  textarea = false,
  rows = 3,
}: {
  label: string;
  value: Loc;
  onChange: (next: Loc) => void;
  textarea?: boolean;
  rows?: number;
}) {
  const cls = textarea ? glassTextarea : `h-10 w-full px-3 ${glassInput}`;
  const Tag = textarea ? "textarea" : "input";
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Tag
          {...(textarea ? { rows } : { type: "text" })}
          placeholder="English"
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          className={cls}
        />
        <Tag
          {...(textarea ? { rows } : { type: "text" })}
          dir="rtl"
          placeholder="Arabic"
          value={value.ar}
          onChange={(e) => onChange({ ...value, ar: e.target.value })}
          className={cls}
        />
        <Tag
          {...(textarea ? { rows } : { type: "text" })}
          dir="rtl"
          placeholder="Kurdish"
          value={value.ku}
          onChange={(e) => onChange({ ...value, ku: e.target.value })}
          className={cls}
        />
      </div>
    </div>
  );
}

const inputClass = `h-10 w-full px-3 ${glassInput}`;

export default function PostForm({
  mode,
  post,
  otherProducts,
}: {
  mode: "create" | "edit";
  post?: AdminPostRow;
  otherProducts: PickableProduct[];
}) {
  const boundAction =
    mode === "edit" && post ? updatePostAction.bind(null, post.slug) : createPostAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(boundAction, {});
  useActionToast(pending, state.error, "Post saved");

  const [coverUrl, setCoverUrl] = useState(post?.cover.url ?? "");
  const [coverAlt, setCoverAlt] = useState<Loc>({
    en: post?.cover.altEn ?? "",
    ar: post?.cover.altAr ?? "",
    ku: post?.cover.altKu ?? "",
  });

  const [blocks, setBlocks] = useState<BlockRow[]>(() =>
    post && post.body.length > 0 ? post.body.map(blockFromAdmin) : [],
  );

  const [uploadError, setUploadError] = useState<string | null>(null);
  type CropTarget = { kind: "cover" } | { kind: "block"; blockId: number };
  const [cropQueue, setCropQueue] = useState<{ target: CropTarget; file: File }[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [videoUploadingId, setVideoUploadingId] = useState<number | null>(null);
  const [posterUploadingId, setPosterUploadingId] = useState<number | null>(null);

  const coverFileRef = useRef<HTMLInputElement>(null);
  const imageFileRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const videoFileRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const posterFileRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  function updateBlock(id: number, patch: Partial<BlockRow>) {
    setBlocks((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addBlock(type: BlockType) {
    setBlocks((rows) => [...rows, newBlock(type)]);
  }
  function removeBlock(id: number) {
    setBlocks((rows) => rows.filter((r) => r.id !== id));
  }
  function moveBlock(from: number, to: number) {
    setBlocks((rows) => {
      if (to < 0 || to >= rows.length || from === to) return rows;
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function queueCrop(target: CropTarget, file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("That doesn't look like an image file.");
      return;
    }
    setUploadError(null);
    setCropQueue((q) => [...q, { target, file }]);
  }

  async function uploadBlob(target: CropTarget, blob: Blob, filename: string) {
    const key = target.kind === "cover" ? "cover" : `block-${target.blockId}`;
    setUploadingKey(key);
    setUploadError(null);
    try {
      const result = await upload(filename, blob, {
        access: "public",
        handleUploadUrl: "/admin/blob-upload",
      });
      if (target.kind === "cover") setCoverUrl(result.url);
      else updateBlock(target.blockId, { imageUrl: result.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingKey(null);
    }
  }

  function handleCropApply(blob: Blob, filename: string) {
    const target = cropQueue[0];
    setCropQueue((q) => q.slice(1));
    if (target) uploadBlob(target.target, blob, filename);
  }
  function handleCropCancel() {
    setCropQueue((q) => q.slice(1));
  }

  async function handleBlockVideoFile(blockId: number, file: File) {
    setVideoUploadingId(blockId);
    setUploadError(null);
    try {
      const result = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/admin/blob-upload",
      });
      updateBlock(blockId, { videoUrl: result.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Video upload failed.");
    } finally {
      setVideoUploadingId(null);
    }
  }

  async function handlePosterFile(blockId: number, file: File) {
    setPosterUploadingId(blockId);
    setUploadError(null);
    try {
      const result = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/admin/blob-upload",
      });
      updateBlock(blockId, { posterUrl: result.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Poster upload failed.");
    } finally {
      setPosterUploadingId(null);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-8">
      <ImageCropModal
        file={cropQueue[0]?.file ?? null}
        defaultAspect={16 / 9}
        onApply={handleCropApply}
        onCancel={handleCropCancel}
      />

      {/* Cover photo */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Cover photo</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          Shown on the Journal index card and behind the article title. Alt text is optional — it
          falls back to the post&rsquo;s title if left blank.
        </p>
        <div className="flex items-start gap-3">
          <div className="relative h-32 w-52 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
            {coverUrl ? (
              <Image src={coverUrl} alt="" fill sizes="208px" className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-slate-400 dark:text-slate-500">
                No cover yet
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => coverFileRef.current?.click()}
                disabled={uploadingKey === "cover"}
                className={`flex h-10 cursor-pointer items-center gap-2 px-3.5 text-sm font-medium text-slate-700 disabled:opacity-60 dark:text-slate-300 ${glassButtonSecondary}`}
              >
                <UploadSimple size={16} aria-hidden="true" />
                {uploadingKey === "cover" ? "Uploading…" : "Upload photo"}
              </button>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) queueCrop({ kind: "cover" }, file);
                  e.target.value = "";
                }}
              />
            </div>
            <Field label="Or paste an image URL">
              <input
                type="text"
                name="coverUrl"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className={inputClass}
              />
            </Field>
            <LocaleFields label="Alt text (optional)" value={coverAlt} onChange={setCoverAlt} textarea={false} />
            <input type="hidden" name="coverAltEn" value={coverAlt.en} />
            <input type="hidden" name="coverAltAr" value={coverAlt.ar} />
            <input type="hidden" name="coverAltKu" value={coverAlt.ku} />
          </div>
        </div>
      </section>

      {/* Title */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Title</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input type="text" name="titleEn" required defaultValue={post?.titleEn} placeholder="English" className={inputClass} />
          <input type="text" name="titleAr" dir="rtl" required defaultValue={post?.titleAr} placeholder="Arabic" className={inputClass} />
          <input type="text" name="titleKu" dir="rtl" required defaultValue={post?.titleKu} placeholder="Kurdish" className={inputClass} />
        </div>
      </section>

      {/* URL slug */}
      <section>
        <Field
          label="URL"
          hint={mode === "edit" ? "Locked after creation so shared links keep working." : "Leave blank to generate from the English title."}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 dark:text-slate-500">/blog/</span>
            <input
              type="text"
              name="slug"
              defaultValue={post?.slug}
              disabled={mode === "edit"}
              placeholder="auto-generated-from-title"
              className={`${inputClass} max-w-xs`}
            />
          </div>
        </Field>
      </section>

      {/* Excerpt */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Excerpt</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          Shown as the index card blurb and the lede at the top of the article.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <textarea name="excerptEn" required rows={3} defaultValue={post?.excerptEn} placeholder="English" className={glassTextarea} />
          <textarea name="excerptAr" dir="rtl" required rows={3} defaultValue={post?.excerptAr} placeholder="Arabic" className={glassTextarea} />
          <textarea name="excerptKu" dir="rtl" required rows={3} defaultValue={post?.excerptKu} placeholder="Kurdish" className={glassTextarea} />
        </div>
      </section>

      {/* Author, date, reading time */}
      <section>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Author">
            <input type="text" name="author" required defaultValue={post?.author ?? "Capitres Editorial"} className={inputClass} />
          </Field>
          <Field label="Date">
            <input type="date" name="postDate" required defaultValue={post?.postDate ?? today} className={inputClass} />
          </Field>
          <Field label="Reading time (minutes)">
            <input type="number" name="readingMinutes" min={1} required defaultValue={post?.readingMinutes ?? 3} className={inputClass} />
          </Field>
        </div>
      </section>

      {/* Body */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Body</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          Build the article out of blocks — paragraphs, headings, quotes, photos, video and links,
          in whatever order you like. Use the arrows to reorder.
        </p>
        <div className="space-y-4">
          {blocks.map((b, i) => {
            const Icon = BLOCK_ICONS[b.type];
            return (
              <div key={b.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <Icon size={16} aria-hidden="true" />
                    {BLOCK_LABELS[b.type]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(i, i - 1)}
                      disabled={i === 0}
                      aria-label="Move block up"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-400"
                    >
                      <CaretUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(i, i + 1)}
                      disabled={i === blocks.length - 1}
                      aria-label="Move block down"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-400"
                    >
                      <CaretDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(b.id)}
                      aria-label="Remove block"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>

                {(b.type === "p" || b.type === "h2") && (
                  <LocaleFields
                    label="Text"
                    value={b.text}
                    onChange={(v) => updateBlock(b.id, { text: v })}
                    textarea={b.type === "p"}
                    rows={4}
                  />
                )}

                {b.type === "quote" && (
                  <div className="space-y-3">
                    <LocaleFields label="Quote" value={b.text} onChange={(v) => updateBlock(b.id, { text: v })} textarea rows={3} />
                    <LocaleFields
                      label="Attribution (optional)"
                      value={b.attribution}
                      onChange={(v) => updateBlock(b.id, { attribution: v })}
                    />
                  </div>
                )}

                {b.type === "image" && (
                  <div className="flex items-start gap-3">
                    <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                      {b.imageUrl ? (
                        <Image src={b.imageUrl} alt="" fill sizes="144px" className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-slate-400 dark:text-slate-500">
                          No photo yet
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => imageFileRefs.current.get(b.id)?.click()}
                          disabled={uploadingKey === `block-${b.id}`}
                          className={`flex h-9 cursor-pointer items-center gap-2 px-3 text-sm font-medium text-slate-700 disabled:opacity-60 dark:text-slate-300 ${glassButtonSecondary}`}
                        >
                          <UploadSimple size={14} aria-hidden="true" />
                          {uploadingKey === `block-${b.id}` ? "Uploading…" : "Upload photo"}
                        </button>
                        <input
                          ref={(el) => {
                            if (el) imageFileRefs.current.set(b.id, el);
                            else imageFileRefs.current.delete(b.id);
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) queueCrop({ kind: "block", blockId: b.id }, file);
                            e.target.value = "";
                          }}
                        />
                      </div>
                      <Field label="Or paste an image URL">
                        <input
                          type="text"
                          value={b.imageUrl}
                          onChange={(e) => updateBlock(b.id, { imageUrl: e.target.value })}
                          className={inputClass}
                        />
                      </Field>
                      <LocaleFields
                        label="Alt text (optional)"
                        value={b.imageAlt}
                        onChange={(v) => updateBlock(b.id, { imageAlt: v })}
                      />
                    </div>
                  </div>
                )}

                {b.type === "video" && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => videoFileRefs.current.get(b.id)?.click()}
                          disabled={videoUploadingId === b.id}
                          className={`flex h-9 cursor-pointer items-center gap-2 px-3 text-sm font-medium text-slate-700 disabled:opacity-60 dark:text-slate-300 ${glassButtonSecondary}`}
                        >
                          <VideoCamera size={14} aria-hidden="true" />
                          {videoUploadingId === b.id ? "Uploading…" : "Upload video"}
                        </button>
                        <input
                          ref={(el) => {
                            if (el) videoFileRefs.current.set(b.id, el);
                            else videoFileRefs.current.delete(b.id);
                          }}
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBlockVideoFile(b.id, file);
                            e.target.value = "";
                          }}
                        />
                        {b.videoUrl && (
                          <button
                            type="button"
                            onClick={() => updateBlock(b.id, { videoUrl: "" })}
                            className="text-xs font-medium text-slate-500 underline decoration-dotted hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                          >
                            Remove video
                          </button>
                        )}
                      </div>
                      {b.videoUrl && (
                        <video
                          key={b.videoUrl}
                          src={b.videoUrl}
                          controls
                          className="mt-3 h-32 w-auto max-w-full rounded-lg border border-slate-200 bg-black dark:border-slate-800"
                        />
                      )}
                      <div className="mt-3">
                        <Field label="Or paste a video URL" hint="Max 80MB; compress longer clips first.">
                          <input
                            type="text"
                            value={b.videoUrl}
                            onChange={(e) => updateBlock(b.id, { videoUrl: e.target.value })}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                      <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Poster image (optional) — shown while the video loads.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => posterFileRefs.current.get(b.id)?.click()}
                          disabled={posterUploadingId === b.id}
                          className={`flex h-9 cursor-pointer items-center gap-2 px-3 text-sm font-medium text-slate-700 disabled:opacity-60 dark:text-slate-300 ${glassButtonSecondary}`}
                        >
                          <UploadSimple size={14} aria-hidden="true" />
                          {posterUploadingId === b.id ? "Uploading…" : "Upload poster"}
                        </button>
                        <input
                          ref={(el) => {
                            if (el) posterFileRefs.current.set(b.id, el);
                            else posterFileRefs.current.delete(b.id);
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePosterFile(b.id, file);
                            e.target.value = "";
                          }}
                        />
                      </div>
                      <div className="mt-3 space-y-3">
                        <Field label="Or paste a poster image URL">
                          <input
                            type="text"
                            value={b.posterUrl}
                            onChange={(e) => updateBlock(b.id, { posterUrl: e.target.value })}
                            className={inputClass}
                          />
                        </Field>
                        {b.posterUrl && (
                          <LocaleFields
                            label="Poster alt text (optional)"
                            value={b.posterAlt}
                            onChange={(v) => updateBlock(b.id, { posterAlt: v })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {b.type === "link" && (
                  <div className="space-y-3">
                    <Field label="URL">
                      <input
                        type="text"
                        value={b.linkUrl}
                        onChange={(e) => updateBlock(b.id, { linkUrl: e.target.value })}
                        placeholder="https://…"
                        className={inputClass}
                      />
                    </Field>
                    <LocaleFields label="Label" value={b.linkLabel} onChange={(v) => updateBlock(b.id, { linkLabel: v })} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {uploadError && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{uploadError}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Add block:</span>
          {(Object.keys(BLOCK_LABELS) as BlockType[]).map((type) => {
            const Icon = BLOCK_ICONS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 px-3 text-xs font-medium text-slate-600 transition-colors hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-400 dark:hover:text-slate-100"
              >
                <Plus size={12} aria-hidden="true" />
                <Icon size={13} aria-hidden="true" />
                {BLOCK_LABELS[type]}
              </button>
            );
          })}
        </div>

        <input type="hidden" name="bodyJson" value={JSON.stringify(blocks.map(blockToPayload))} />
      </section>

      {/* Related products */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Related products</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          Shown as a &ldquo;shop the story&rdquo; strip at the end of the article. Optional.
        </p>
        <RelatedProductsPicker otherProducts={otherProducts} defaultSelected={post?.relatedProductSlugs ?? []} />
      </section>

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className={`rounded-lg px-4 py-3 text-sm font-medium ${glassTone.danger}`}>
            {state.error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        {post && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${post.published ? glassTone.info : glassTone.neutral}`}>
            Currently {post.published ? "published" : "a draft"}
          </span>
        )}
        <div className="ms-auto flex items-center gap-3">
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={pending}
            className={`flex h-11 cursor-pointer items-center px-5 text-sm font-semibold disabled:cursor-not-allowed ${glassButtonSecondary} text-slate-700 dark:text-slate-300`}
          >
            {pending ? "Saving…" : "Save draft"}
          </button>
          <button
            type="submit"
            name="intent"
            value="publish"
            disabled={pending}
            className={`flex h-11 cursor-pointer items-center px-6 text-sm font-semibold disabled:cursor-not-allowed ${glassButtonPrimary}`}
          >
            {pending ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}
