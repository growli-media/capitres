import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminProducts } from "@/lib/admin/products";
import { formatIQD } from "@/lib/money";
import ProductRowActions from "./ProductRowActions";
import ProductsTable from "./ProductsTable";
import ExportProductsButton from "./ExportProductsButton";
import { CreatedToast } from "../components/CreatedToast";
import { glassCard, glassButtonPrimary, glassTone } from "../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Products" };

function StockBadge({
  isGiftCard,
  totalStock,
}: {
  isGiftCard: boolean;
  totalStock: number;
}) {
  if (isGiftCard) {
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>
        Digital
      </span>
    );
  }
  if (totalStock === 0) {
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.danger}`}>
        Sold out
      </span>
    );
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

export default async function AdminProductsPage() {
  await requirePermission("products");
  const products = await listAdminProducts();

  return (
    <div>
      <CreatedToast param="deleted" message="Product deleted" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {products.length} total — changes go live on the site immediately.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportProductsButton products={products} />
          <Link
            href="/admin/products/new"
            className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 px-4 text-sm font-semibold ${glassButtonPrimary}`}
          >
            <Plus size={16} aria-hidden="true" />
            New product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No products yet.</p>
          <Link
            href="/admin/products/new"
            className={`mt-4 inline-flex h-10 cursor-pointer items-center px-4 text-sm font-semibold ${glassButtonPrimary}`}
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll — the table
              below is desktop-only (md:block). Every field is visible
              immediately, actions included, without needing to scroll
              sideways to reach them. */}
          <div className="space-y-3 md:hidden">
            {products.map((p) => (
              <div key={p.id} className={`p-4 ${glassCard} ${p.archived ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    {p.images[0] && (
                      <Image
                        src={p.images[0].url}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="block truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {p.titleEn}
                    </Link>
                    <span className="text-xs text-slate-400 dark:text-slate-500">/{p.slug}</span>
                  </div>
                  <ProductRowActions id={p.id} archived={p.archived} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{p.category}</span>
                  <span className="price text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatIQD(p.priceAmount, "en")}
                  </span>
                  {p.compareAtAmount && (
                    <span className="price text-xs text-slate-400 line-through dark:text-slate-500">
                      {formatIQD(p.compareAtAmount, "en")}
                    </span>
                  )}
                  <StockBadge
                    isGiftCard={p.category === "gift-cards"}
                    totalStock={p.totalStock}
                  />
                  {p.archived ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>
                      Archived
                    </span>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>
                      Live
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table — bulk select + inline price edit */}
          <ProductsTable products={products} />
        </>
      )}
    </div>
  );
}
