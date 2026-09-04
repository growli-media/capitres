"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Trash, X } from "@phosphor-icons/react";
import type { AdminProductRow } from "@/lib/admin/products";
import { formatIQD } from "@/lib/money";
import ProductRowActions from "./ProductRowActions";
import { bulkArchiveProductsAction, bulkDeleteProductsAction, updateProductPriceAction } from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassCard, glassTone, glassButtonSecondary, glassInput } from "../../glass";

function StockBadge({ isGiftCard, totalStock }: { isGiftCard: boolean; totalStock: number }) {
  if (isGiftCard) {
    return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>Digital</span>;
  }
  if (totalStock === 0) {
    return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.danger}`}>Sold out</span>;
  }
  if (totalStock <= 10) {
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.warning}`}>
        Low — {totalStock} left
      </span>
    );
  }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.success}`}>
      In stock — {totalStock}
    </span>
  );
}

/** Click the price to edit it in place — Enter or blur saves, Escape
 * cancels. Skips the round trip through the full product edit page for
 * what's usually a one-field change. */
function InlinePrice({ id, priceAmount, compareAtAmount }: { id: string; priceAmount: number; compareAtAmount: number | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(priceAmount));
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();

  function save() {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      setValue(String(priceAmount));
      setEditing(false);
      return;
    }
    if (amount === priceAmount) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await updateProductPriceAction(id, amount);
      if (result.error) {
        showToast(result.error, "danger");
        setValue(String(priceAmount));
      } else {
        showToast("Price updated");
      }
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <input
        type="number"
        min={1}
        step={1}
        autoFocus
        disabled={pending}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(String(priceAmount));
            setEditing(false);
          }
        }}
        className={`h-8 w-28 px-2 text-sm ${glassInput}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="price cursor-pointer rounded px-1 -mx-1 text-start font-medium text-slate-900 decoration-dotted underline-offset-4 hover:underline dark:text-slate-100"
      title="Click to edit price"
    >
      {formatIQD(priceAmount, "en")}
      {compareAtAmount && (
        <span className="price ms-2 text-xs font-normal text-slate-400 line-through dark:text-slate-500">
          {formatIQD(compareAtAmount, "en")}
        </span>
      )}
    </button>
  );
}

export default function ProductsTable({ products }: { products: AdminProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === products.length ? new Set() : new Set(products.map((p) => p.id))));
  }

  function bulkArchive(archived: boolean) {
    const ids = Array.from(selected);
    startTransition(async () => {
      await bulkArchiveProductsAction(ids, archived);
      showToast(`${ids.length} product${ids.length === 1 ? "" : "s"} ${archived ? "archived" : "unarchived"}`);
      setSelected(new Set());
    });
  }

  function bulkDelete() {
    const ids = Array.from(selected);
    if (!confirm(`Delete ${ids.length} product${ids.length === 1 ? "" : "s"} permanently? This can't be undone.`)) return;
    startTransition(async () => {
      await bulkDeleteProductsAction(ids);
      showToast(`${ids.length} product${ids.length === 1 ? "" : "s"} deleted`, "danger");
      setSelected(new Set());
    });
  }

  return (
    <div className={`hidden md:block ${glassCard}`}>
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {selected.size} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => bulkArchive(true)}
              className={`flex h-8 items-center gap-1.5 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:text-slate-300 ${glassButtonSecondary}`}
            >
              Archive
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => bulkArchive(false)}
              className={`flex h-8 items-center gap-1.5 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:text-slate-300 ${glassButtonSecondary}`}
            >
              Unarchive
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={bulkDelete}
              className="flex h-8 items-center gap-1.5 rounded-full border border-red-300 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash size={13} />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
              className="flex h-8 w-8 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <th className="w-10 px-4 py-3">
              <button
                type="button"
                onClick={toggleAll}
                aria-label={selected.size === products.length ? "Deselect all" : "Select all"}
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  selected.size === products.length
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              >
                {selected.size === products.length && <Check size={11} weight="bold" />}
              </button>
            </th>
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Product</th>
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Category</th>
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Price</th>
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Stock</th>
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-label={selected.has(p.id) ? `Deselect ${p.titleEn}` : `Select ${p.titleEn}`}
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    selected.has(p.id)
                      ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {selected.has(p.id) && <Check size={11} weight="bold" />}
                </button>
              </td>
              <td className={`px-4 py-3 ${p.archived ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    {p.images[0] && (
                      <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="min-w-40">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="block truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {p.titleEn}
                    </Link>
                    <span className="text-xs text-slate-400 dark:text-slate-500">/{p.slug}</span>
                  </div>
                </div>
              </td>
              <td className={`px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 ${p.archived ? "opacity-50" : ""}`}>
                {p.category}
              </td>
              <td className={`px-4 py-3 whitespace-nowrap ${p.archived ? "opacity-50" : ""}`}>
                <InlinePrice id={p.id} priceAmount={p.priceAmount} compareAtAmount={p.compareAtAmount} />
              </td>
              <td className={`px-4 py-3 whitespace-nowrap ${p.archived ? "opacity-50" : ""}`}>
                <StockBadge isGiftCard={p.category === "gift-cards"} totalStock={p.totalStock} />
              </td>
              <td className={`px-4 py-3 whitespace-nowrap ${p.archived ? "opacity-50" : ""}`}>
                {p.archived ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>Archived</span>
                ) : (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>Live</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <ProductRowActions id={p.id} archived={p.archived} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
