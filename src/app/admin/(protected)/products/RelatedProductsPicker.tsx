"use client";

import { useState } from "react";
import Image from "next/image";
import { MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import Modal from "../components/Modal";
import { formatIQD } from "@/lib/money";
import { glassButtonPrimary, glassButtonSecondary, glassInput } from "../../glass";

export interface PickableProduct {
  slug: string;
  titleEn: string;
  image: string | null;
  priceAmount: number;
  compareAtAmount: number | null;
}

/**
 * "Frequently bought together" picker — a button opens a modal listing
 * every other product (photo, name, price) to check on/off, with the
 * current selection summarized as its own list underneath so an admin
 * can see exactly what's linked without reopening the modal. Selection
 * is controlled state; hidden inputs mirror it into the surrounding
 * <form> since Modal portals outside the form's DOM subtree and its
 * checkboxes can't be relied on for native form submission.
 */
export default function RelatedProductsPicker({
  otherProducts,
  defaultSelected,
}: {
  otherProducts: PickableProduct[];
  defaultSelected: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const bySlug = new Map(otherProducts.map((p) => [p.slug, p]));
  const selectedProducts = selected
    .map((slug) => bySlug.get(slug))
    .filter((p): p is PickableProduct => !!p);

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  const filtered = otherProducts.filter(
    (p) => !search || p.titleEn.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {selectedProducts.length > 0 && (
        <ul className="mb-3 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-300 dark:divide-slate-800 dark:border-slate-700">
          {selectedProducts.map((p) => (
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
                onClick={() => toggle(p.slug)}
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
        {selectedProducts.length > 0 ? "Edit linked products" : "Choose products"}
      </button>

      {selected.map((slug) => (
        <input key={slug} type="hidden" name="relatedProductSlugs" value={slug} />
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Frequently bought together">
        <div className="space-y-3">
          {otherProducts.length > 8 && (
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
              const checked = selected.includes(p.slug);
              return (
                <li key={p.slug}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3 transition-colors has-[:checked]:bg-slate-50 dark:has-[:checked]:bg-slate-800/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.slug)}
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
                        {p.compareAtAmount && (
                          <span className="price ms-1.5 text-slate-400 line-through dark:text-slate-500">
                            {formatIQD(p.compareAtAmount, "en")}
                          </span>
                        )}
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
            Done — {selectedProducts.length} selected
          </button>
        </div>
      </Modal>
    </div>
  );
}
