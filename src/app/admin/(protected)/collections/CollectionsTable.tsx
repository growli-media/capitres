"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { DotsSixVertical } from "@phosphor-icons/react";
import type { AdminCollectionRow } from "@/lib/admin/collections";
import { reorderCollectionsAction } from "./actions";
import CollectionRowActions from "./CollectionRowActions";
import { useAdminToast } from "../components/AdminToastProvider";
import { glassCard, glassTone } from "../../glass";

/**
 * Desktop table with live drag-to-reorder — dragging a row over another
 * immediately splices it into that position (the array itself reorders
 * on every dragover, not just on drop), so rows visibly shift out of the
 * way as you drag, the same way Trello/Notion-style reorder lists work.
 * Replaces the old plain "Order" number column, which needed the admin
 * to type a number and guess how it compared to every other row's.
 *
 * The <tr> carries the dragover/dragend listeners (so dropping anywhere
 * across the row's width works, not just on a tiny handle), but only the
 * handle icon itself is `draggable` — making the whole row draggable
 * would fight with clicking the title link or the row actions menu.
 */
export default function CollectionsTable({
  collections,
}: {
  collections: AdminCollectionRow[];
}) {
  const [items, setItems] = useState(collections);
  // Always-current mirror of `items` for the dragend handler, which
  // closes over whatever `items` was at drag-start otherwise — state
  // updates from the dragover reordering happen after that closure was
  // created.
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
      await reorderCollectionsAction(slugs);
      showToast("Order updated");
    });
  }

  return (
    <div className={`hidden md:block ${glassCard}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <th className="w-10 px-2 py-3" />
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Collection</th>
            <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Theme</th>
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
              <td className={`px-4 py-3 ${c.archived ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    {c.heroImageUrl && (
                      <Image
                        src={c.heroImageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="min-w-40">
                    <Link
                      href={`/admin/collections/${c.slug}/edit`}
                      className="block truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {c.titleEn}
                    </Link>
                    <span className="text-xs text-slate-400 dark:text-slate-500">/{c.slug}</span>
                  </div>
                </div>
              </td>
              <td
                className={`px-4 py-3 capitalize whitespace-nowrap text-slate-600 dark:text-slate-400 ${c.archived ? "opacity-50" : ""}`}
              >
                {c.theme}
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
                <CollectionRowActions slug={c.slug} archived={c.archived} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
