"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PencilSimple } from "@phosphor-icons/react";
import type { AdminProductRow } from "@/lib/admin/products";
import { formatIQD } from "@/lib/money";
import Modal from "../components/Modal";
import { glassButtonPrimary, glassTone } from "../../glass";

/** Click a product's thumbnail to peek at it — photo, price, stock —
 * without leaving the list, for the common "which one was that again"
 * glance that doesn't need the full edit page. */
export default function ProductQuickView({ product }: { product: AdminProductRow }) {
  const [open, setOpen] = useState(false);
  const isGiftCard = product.category === "gift-cards";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Quick view ${product.titleEn}`}
        className="relative block h-12 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md bg-slate-100 transition-opacity hover:opacity-80 dark:bg-slate-800"
      >
        {product.images[0] && (
          <Image src={product.images[0].url} alt="" fill sizes="40px" className="object-cover" unoptimized />
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={product.titleEn}>
        <div className="flex gap-4">
          <div className="relative h-40 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {product.images[0] && (
              <Image src={product.images[0].url} alt="" fill sizes="128px" className="object-cover" unoptimized />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">/{product.slug}</p>
            <p className="price text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatIQD(product.priceAmount, "en")}
              {product.compareAtAmount && (
                <span className="price ms-2 text-sm font-normal text-slate-400 line-through dark:text-slate-500">
                  {formatIQD(product.compareAtAmount, "en")}
                </span>
              )}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{product.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {isGiftCard ? (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>Digital</span>
              ) : product.totalStock === 0 ? (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.danger}`}>Sold out</span>
              ) : (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.success}`}>
                  {product.totalStock} in stock
                </span>
              )}
              {product.archived ? (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>Archived</span>
              ) : (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>Live</span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/admin/products/${product.id}/edit`}
          className={`mt-5 flex h-10 w-full items-center justify-center gap-1.5 text-sm font-semibold ${glassButtonPrimary}`}
        >
          <PencilSimple size={15} />
          Edit product
        </Link>
      </Modal>
    </>
  );
}
