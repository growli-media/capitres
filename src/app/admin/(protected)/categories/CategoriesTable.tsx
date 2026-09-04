"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { DotsSixVertical } from "@phosphor-icons/react";
import type { AdminCategoryRow } from "@/lib/admin/categories";
import { reorderCategoriesAction } from "./actions";
import CategoryRowActions from "./CategoryRowActions";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassCard, glassTone } from "../../glass";

/** Same live-drag-reorder table as collections/CollectionsTable.tsx —
 * see its doc comment for how the dragover-splices-live mechanics work.
 * `reserved` is computed server-side (isReservedCategory lives in a
 * server-only module) and passed down as plain data instead of an
 * import, since a client component can't import that module at all. */
export default function CategoriesTable({
  categories,
}: {
  categories: (AdminCategoryRow & { reserved: boolean })[];
}) {
  const [items, setItems] = useState(categories);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const showToast = useAdminToast();

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
    const slugs = itemsRef.current.map((c) => c.slug);
    startTransition(async () => {
      await reorderCategoriesAction(slugs);
      showToast("Order updated");
    });
  }

  return (
    <div className={`hidden md:block ${glassCard}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <th className="w-10 px-2 py-3" />
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Category</th>
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Products</th>
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((c, i) => (
            <tr
              key={c.slug}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`transition-opacity ${dragIndex === i ? "opacity-40" : ""}`}
            >
              <td className="px-2 py-3">
                <span
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  aria-label="Drag to reorder"
                  className="flex h-8 w-8 cursor-grab items-center justify-center text-slate-300 transition-colors hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
                >
                  <DotsSixVertical size={16} />
                </span>
              </td>
              <td className={`px-4 py-3 whitespace-nowrap ${c.archived ? "opacity-50" : ""}`}>
                <Link
                  href={`/admin/categories/${c.slug}/edit`}
                  className="font-medium text-slate-900 hover:underline dark:text-slate-100"
                >
                  {c.titleEn}
                </Link>
                <span className="ms-2 text-xs text-slate-400 dark:text-slate-500">/{c.slug}</span>
              </td>
              <td
                className={`px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 ${c.archived ? "opacity-50" : ""}`}
              >
                {c.productCount}
              </td>
              <td className={`px-4 py-3 whitespace-nowrap ${c.archived ? "opacity-50" : ""}`}>
                {c.archived ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>
                    Archived
                  </span>
                ) : (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>
                    Live
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <CategoryRowActions slug={c.slug} archived={c.archived} reserved={c.reserved} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
