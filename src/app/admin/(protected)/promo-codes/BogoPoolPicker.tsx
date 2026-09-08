"use client";

import { useState } from "react";
import Image from "next/image";
import { MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import Modal from "../components/Modal";
import { formatIQD } from "@/lib/money";
import { glassButtonPrimary, glassButtonSecondary, glassInput } from "../../glass";
import type { PickableProduct } from "../products/RelatedProductsPicker";

export interface PickableCategory {
  slug: string;
  titleEn: string;
}

/**
 * One "buy" or "get" pool for a BOGO promo code — a product picker
 * (generalized from products/RelatedProductsPicker.tsx's exact modal/
 * search/checkbox-list pattern, parameterized by field name so it can be
 * instantiated twice on the same form) plus a short inline category
 * checkbox list (no modal needed, there are only a handful of categories).
 * Both mirror their selection into hidden inputs, since Modal portals
 * outside the form's DOM subtree and its own checkboxes can't be relied
 * on for native form submission.
 */
export default function BogoPoolPicker({
  label,
  products,
  categories,
  productFieldName,
  categoryFieldName,
  defaultSelectedProducts,
  defaultSelectedCategories,
}: {
  label: string;
  products: PickableProduct[];
  categories: PickableCategory[];
  productFieldName: string;
  categoryFieldName: string;
  defaultSelectedProducts: string[];
  defaultSelectedCategories: string[];
}) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(defaultSelectedProducts);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(defaultSelectedCategories);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const chosenProducts = selectedProducts
    .map((slug) => bySlug.get(slug))
    .filter((p): p is PickableProduct => !!p);

  function toggleProduct(slug: string) {
    setSelectedProducts((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }
  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  const filtered = products.filter(
    (p) => !search || p.titleEn.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>

      {categories.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const checked = selectedCategories.includes(c.slug);
              return (
                <label
                  key={c.slug}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white dark:border-slate-700 dark:text-slate-300 dark:has-[:checked]:border-slate-100 dark:has-[:checked]:bg-slate-100 dark:has-[:checked]:text-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(c.slug)}
                    className="sr-only"
                  />
                  {c.titleEn}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          Specific products
        </p>
        {chosenProducts.length > 0 && (
          <ul className="mb-2 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-300 dark:divide-slate-800 dark:border-slate-700">
            {chosenProducts.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 px-3 py-2">
                <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  {p.image && (
                    <Image src={p.image} alt="" fill sizes="36px" className="object-cover" unoptimized />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {p.titleEn}
                  </p>
                  <p className="price text-xs text-slate-500 dark:text-slate-400">
                    {formatIQD(p.priceAmount, "en")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleProduct(p.slug)}
                  aria-label={`Remove ${p.titleEn}`}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <Trash size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-10 cursor-pointer items-center gap-2 px-3.5 text-sm font-medium text-slate-700 dark:text-slate-300 ${glassButtonSecondary}`}
        >
          <Plus size={14} aria-hidden="true" />
          {chosenProducts.length > 0 ? "Edit products" : "Choose products"}
        </button>
      </div>

      {selectedProducts.map((slug) => (
        <input key={slug} type="hidden" name={productFieldName} value={slug} />
      ))}
      {selectedCategories.map((slug) => (
        <input key={slug} type="hidden" name={categoryFieldName} value={slug} />
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title={`${label} — products`}>
        <div className="space-y-3">
          {products.length > 8 && (
            <div className="relative">
              <MagnifyingGlass
                size={14}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className={`h-10 w-full ps-9 pe-3 ${glassInput}`}
              />
            </div>
          )}
          <ul className="max-h-80 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-300 dark:divide-slate-800 dark:border-slate-700">
            {filtered.map((p) => {
              const checked = selectedProducts.includes(p.slug);
              return (
                <li key={p.slug}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3 transition-colors has-[:checked]:bg-slate-50 dark:has-[:checked]:bg-slate-800/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(p.slug)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-slate-100"
                    />
                    <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {p.image && (
                        <Image src={p.image} alt="" fill sizes="36px" className="object-cover" unoptimized />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.titleEn}
                      </p>
                      <p className="price text-xs text-slate-500 dark:text-slate-400">
                        {formatIQD(p.priceAmount, "en")}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                No products match &ldquo;{search}&rdquo;.
              </li>
            )}
          </ul>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`flex h-10 w-full cursor-pointer items-center justify-center text-sm font-semibold ${glassButtonPrimary}`}
          >
            Done — {chosenProducts.length} selected
          </button>
        </div>
      </Modal>
    </div>
  );
}
