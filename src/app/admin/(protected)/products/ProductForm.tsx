"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import {
  CaretDown,
  CaretUp,
  DotsSixVertical,
  Plus,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import type { AdminProductRow, AdminVariant } from "@/lib/admin/products";
import { createProductAction, updateProductAction, type FormState } from "./actions";
import { uploadProductImage } from "./upload-action";

interface ImageRow {
  id: number;
  url: string;
  altEn: string;
  altAr: string;
  altKu: string;
}

interface ColorRow {
  id: number;
  hex: string;
  nameEn: string;
  nameAr: string;
  nameKu: string;
}

let rowIdSeq = 0;
function nextRowId() {
  rowIdSeq += 1;
  return rowIdSeq;
}

const GENDERS = ["men", "women", "unisex"] as const;

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

export default function ProductForm({
  mode,
  product,
  variants,
  collections,
  categories,
}: {
  mode: "create" | "edit";
  product?: AdminProductRow;
  variants?: AdminVariant[];
  collections: { slug: string; titleEn: string }[];
  categories: { slug: string; titleEn: string }[];
}) {
  const boundAction =
    mode === "edit" && product
      ? updateProductAction.bind(null, product.id, product.slug)
      : createProductAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    boundAction,
    {},
  );

  const [category, setCategory] = useState(
    product?.category ?? categories[0]?.slug ?? "tees",
  );
  const [images, setImages] = useState<ImageRow[]>(() =>
    product && product.images.length > 0
      ? product.images.map((img) => ({
          id: nextRowId(),
          url: img.url,
          altEn: img.alt.en,
          altAr: img.alt.ar,
          altKu: img.alt.ku,
        }))
      : [{ id: nextRowId(), url: "", altEn: "", altAr: "", altKu: "" }],
  );
  const [colors, setColors] = useState<ColorRow[]>(() =>
    (product?.colors ?? []).map((c) => ({
      id: nextRowId(),
      hex: c.hex,
      nameEn: c.name.en,
      nameAr: c.name.ar,
      nameKu: c.name.ku,
    })),
  );
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [addDragOver, setAddDragOver] = useState(false);
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const isGiftCard = category === "gift-cards";
  const sizesDefault = (variants ?? [])
    .filter((v) => v.size !== "DIGITAL")
    .map((v) => `${v.size}, ${v.stock}`)
    .join("\n");

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

  function updateColor(id: number, patch: Partial<ColorRow>) {
    setColors((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addColor() {
    setColors((rows) => [
      ...rows,
      { id: nextRowId(), hex: "#000000", nameEn: "", nameAr: "", nameKu: "" },
    ]);
  }
  function removeColor(id: number) {
    setColors((rows) => rows.filter((r) => r.id !== id));
  }

  async function uploadFile(id: number, file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("That doesn't look like an image file.");
      return;
    }
    setUploadingId(id);
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadProductImage(fd);
    setUploadingId(null);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) updateImage(id, { url: result.url });
  }

  function handleFileChange(id: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(id, file);
  }

  /** A drop on a photo row: an external image file uploads into that row;
   * an internal drag (a row being reordered) drops it into this slot. */
  function handleRowDrop(e: React.DragEvent, id: number, index: number) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(id, file);
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
      uploadFile(id, file);
    }
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Photos */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Photos</h2>
        <p className="mb-3 text-xs text-slate-400">
          The first photo (marked <span className="font-semibold text-slate-500">Main</span>)
          is the one shown in listings. Drag the handle{" "}
          <DotsSixVertical size={12} className="inline align-middle" aria-hidden="true" /> or
          use the arrows to reorder, and drop an image onto a photo to replace it.
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
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200"
              }`}
            >
              {/* Reorder controls */}
              <div className="flex flex-col items-center gap-0.5 pt-1 text-slate-300">
                <button
                  type="button"
                  onClick={() => moveImage(i, i - 1)}
                  disabled={i === 0}
                  aria-label="Move photo up"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
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
                  className="cursor-grab text-slate-400 transition-colors hover:text-slate-600 active:cursor-grabbing"
                >
                  <DotsSixVertical size={18} />
                </span>
                <button
                  type="button"
                  onClick={() => moveImage(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move photo down"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <CaretDown size={14} />
                </button>
              </div>

              {/* Thumbnail (also a drop target for a replacement image) */}
              <div className="relative h-32 w-26 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
                {row.url ? (
                  <Image src={row.url} alt="" fill sizes="104px" className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-slate-400">
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
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
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
                      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash size={15} />
                    </button>
                  )}
                </div>
                <Field label="Or paste an image URL">
                  <input
                    type="text"
                    name="imageUrl"
                    value={row.url}
                    onChange={(e) => updateImage(row.id, { url: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Alt text (EN)">
                    <input
                      type="text"
                      name="imageAltEn"
                      value={row.altEn}
                      onChange={(e) => updateImage(row.id, { altEn: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Alt text (AR)">
                    <input
                      type="text"
                      name="imageAltAr"
                      dir="rtl"
                      value={row.altAr}
                      onChange={(e) => updateImage(row.id, { altAr: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Alt text (KU)">
                    <input
                      type="text"
                      name="imageAltKu"
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
          {uploadError && <p className="text-xs text-amber-700">{uploadError}</p>}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setAddDragOver(true);
            }}
            onDragLeave={() => setAddDragOver(false)}
            onDrop={handleAddDrop}
            className={`flex items-center gap-2 rounded-lg border border-dashed px-3.5 py-2.5 transition-colors ${
              addDragOver ? "border-slate-900 bg-slate-50" : "border-slate-300"
            }`}
          >
            <button
              type="button"
              onClick={addImage}
              className="flex h-8 cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <Plus size={14} aria-hidden="true" />
              Add another photo
            </button>
            <span className="text-xs text-slate-400">or drag images here</span>
          </div>
        </div>
      </section>

      {/* Title */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Title</h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="English">
            <input type="text" name="titleEn" required defaultValue={product?.titleEn} className={inputClass} />
          </Field>
          <Field label="Arabic">
            <input
              type="text"
              name="titleAr"
              dir="rtl"
              required
              defaultValue={product?.titleAr}
              className={inputClass}
            />
          </Field>
          <Field label="Kurdish">
            <input
              type="text"
              name="titleKu"
              dir="rtl"
              required
              defaultValue={product?.titleKu}
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
            <span className="text-sm text-slate-400">/products/</span>
            <input
              type="text"
              name="slug"
              defaultValue={product?.slug}
              disabled={mode === "edit"}
              placeholder="auto-generated-from-title"
              className={`${inputClass} max-w-xs`}
            />
          </div>
        </Field>
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
              defaultValue={product?.descriptionEn}
              className={textareaClass}
            />
          </Field>
          <Field label="Arabic">
            <textarea
              name="descriptionAr"
              dir="rtl"
              required
              rows={4}
              defaultValue={product?.descriptionAr}
              className={textareaClass}
            />
          </Field>
          <Field label="Kurdish">
            <textarea
              name="descriptionKu"
              dir="rtl"
              required
              rows={4}
              defaultValue={product?.descriptionKu}
              className={textareaClass}
            />
          </Field>
        </div>
      </section>

      {/* Details */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Details &amp; care
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          One line per detail — same number of lines in each language.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="English">
            <textarea
              name="detailsEn"
              rows={4}
              defaultValue={product?.details.map((d) => d.en).join("\n")}
              className={textareaClass}
            />
          </Field>
          <Field label="Arabic">
            <textarea
              name="detailsAr"
              dir="rtl"
              rows={4}
              defaultValue={product?.details.map((d) => d.ar).join("\n")}
              className={textareaClass}
            />
          </Field>
          <Field label="Kurdish">
            <textarea
              name="detailsKu"
              dir="rtl"
              rows={4}
              defaultValue={product?.details.map((d) => d.ku).join("\n")}
              className={textareaClass}
            />
          </Field>
        </div>
      </section>

      {/* Category / Gender */}
      <section className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.titleEn}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gender">
          <select
            name="gender"
            defaultValue={product?.gender ?? "unisex"}
            className={`${inputClass} cursor-pointer`}
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
      </section>

      {/* Pricing */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Pricing (IQD)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price">
            <input
              type="number"
              name="priceAmount"
              required
              min={1}
              step={1}
              defaultValue={product?.priceAmount}
              className={inputClass}
            />
          </Field>
          <Field label="Discount — was price" hint="Leave blank for no discount badge.">
            <input
              type="number"
              name="compareAtAmount"
              min={1}
              step={1}
              defaultValue={product?.compareAtAmount ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Sizes / gift card denominations */}
      {isGiftCard ? (
        <section>
          <Field
            label="Denominations (IQD)"
            hint="Comma-separated amounts customers can choose, e.g. 25000, 50000, 100000"
          >
            <input
              type="text"
              name="giftcardDenominations"
              defaultValue={product?.giftcardDenominations?.join(", ")}
              className={inputClass}
            />
          </Field>
        </section>
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Sizes &amp; stock
          </h2>
          <p className="mb-3 text-xs text-slate-400">
            One size per line, as &ldquo;size, quantity&rdquo; — e.g. &ldquo;M, 10&rdquo;. Set a
            quantity to 0 to mark that size sold out.
          </p>
          <textarea
            name="sizes"
            rows={5}
            defaultValue={sizesDefault}
            placeholder={"S, 5\nM, 10\nL, 8"}
            className={`${textareaClass} font-mono`}
          />
        </section>
      )}

      {/* Colours */}
      {!isGiftCard && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Colours</h2>
          <p className="mb-3 text-xs text-slate-400">
            Optional. Add one row per colour this product comes in — customers
            pick between them on the product page. Leave empty for a
            single-colour product.
          </p>
          <div className="space-y-3">
            {colors.map((row) => (
              <div key={row.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-end gap-3">
                <Field label="Swatch">
                  <input
                    type="color"
                    value={row.hex}
                    onChange={(e) => updateColor(row.id, { hex: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
                  />
                  <input type="hidden" name="colorHex" value={row.hex} />
                </Field>
                <Field label="Name (EN)">
                  <input
                    type="text"
                    name="colorNameEn"
                    value={row.nameEn}
                    onChange={(e) => updateColor(row.id, { nameEn: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Name (AR)">
                  <input
                    type="text"
                    name="colorNameAr"
                    dir="rtl"
                    value={row.nameAr}
                    onChange={(e) => updateColor(row.id, { nameAr: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Name (KU)">
                  <input
                    type="text"
                    name="colorNameKu"
                    dir="rtl"
                    value={row.nameKu}
                    onChange={(e) => updateColor(row.id, { nameKu: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => removeColor(row.id)}
                  aria-label="Remove colour"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addColor}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              <Plus size={14} aria-hidden="true" />
              Add a colour
            </button>
          </div>
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Collections</h2>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <label
                key={c.slug}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white"
              >
                <input
                  type="checkbox"
                  name="collectionSlugs"
                  value={c.slug}
                  defaultChecked={product?.collectionSlugs.includes(c.slug)}
                  className="sr-only"
                />
                {c.titleEn}
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Flags */}
      <section className="flex gap-6">
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="h-4 w-4" />
          Mark as &ldquo;New&rdquo;
        </label>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured}
            className="h-4 w-4"
          />
          Feature on homepage
        </label>
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
          {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
