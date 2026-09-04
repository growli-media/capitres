"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import type { AdminProductRow } from "@/lib/admin/products";
import { downloadCsv } from "../components/csv";
import { glassButtonSecondary } from "../../glass";

export default function ExportProductsButton({ products }: { products: AdminProductRow[] }) {
  function handleExport() {
    downloadCsv(
      `capitres-products-${new Date().toISOString().slice(0, 10)}.csv`,
      products.map((p) => ({
        title: p.titleEn,
        slug: p.slug,
        category: p.category,
        priceIQD: p.priceAmount,
        compareAtIQD: p.compareAtAmount ?? "",
        stock: p.totalStock,
        status: p.archived ? "Archived" : "Live",
      })),
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 ${glassButtonSecondary}`}
    >
      <DownloadSimple size={16} aria-hidden="true" />
      Export CSV
    </button>
  );
}
