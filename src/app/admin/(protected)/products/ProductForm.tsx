"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { UploadSimple } from "@phosphor-icons/react";
import type { AdminProductRow, AdminVariant } from "@/lib/admin/products";
import { createProductAction, updateProductAction, type FormState } from "./actions";
import { uploadProductImage } from "./upload-action";

const CATEGORIES = ["tees", "jerseys", "outerwear", "accessories", "gift-cards"] as const;
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
}: {
  mode: "create" | "edit";
  product?: AdminProductRow;
  variants?: AdminVariant[];
  collections: { slug: string; titleEn: string }[];
}) {
  const boundAction =
    mode === "edit" && product
      ? updateProductAction.bind(null, product.id, product.slug)
      : createProductAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    boundAction,
    {},
  );

  const [category, setCategory] = useState(product?.category ?? "tees");
  const [imageUrl, setImageUrl] = useState(product?.images[0]?.url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGiftCard = category === "gift-cards";
  const sizesDefault = (variants ?? [])
    .filter((v) => v.size !== "DIGITAL")
    .map((v) => `${v.size}, ${v.stock}`)
    .join("\n");
  const existingColor = product?.colors[0];

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
    if (result.url) setImageUrl(result.url);
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Photo */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Photo</h2>
        <div className="flex items-start gap-5">
          <div className="relative h-32 w-26 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            {imageUrl && (
              <Image src={imageUrl} alt="" fill sizes="104px" className="object-cover" unoptimized />
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
                name="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Alt text (EN)">
                <input
                  type="text"
                  name="imageAltEn"
                  defaultValue={product?.images[0]?.alt.en}
                  className={inputClass}
                />
              </Field>
              <Field label="Alt text (AR)">
                <input
                  type="text"
                  name="imageAltAr"
                  dir="rtl"
                  defaultValue={product?.images[0]?.alt.ar}
                  className={inputClass}
                />
              </Field>
              <Field label="Alt text (KU)">
                <input
                  type="text"
                  name="imageAltKu"
                  dir="rtl"
                  defaultValue={product?.images[0]?.alt.ku}
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
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className={`${inputClass} cursor-pointer`}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
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

      {/* Colour */}
      {!isGiftCard && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Colour</h2>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Swatch">
              <input
                type="color"
                name="colorHex"
                defaultValue={existingColor?.hex ?? "#000000"}
                className="h-10 w-full cursor-pointer rounded-lg border border-slate-300"
              />
            </Field>
            <Field label="Name (EN)">
              <input
                type="text"
                name="colorNameEn"
                defaultValue={existingColor?.name.en}
                className={inputClass}
              />
            </Field>
            <Field label="Name (AR)">
              <input
                type="text"
                name="colorNameAr"
                dir="rtl"
                defaultValue={existingColor?.name.ar}
                className={inputClass}
              />
            </Field>
            <Field label="Name (KU)">
              <input
                type="text"
                name="colorNameKu"
                dir="rtl"
                defaultValue={existingColor?.name.ku}
                className={inputClass}
              />
            </Field>
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
