import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminProducts } from "@/lib/admin/products";
import { formatIQD } from "@/lib/money";
import ProductRowActions from "./ProductRowActions";
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {products.length} total — changes go live on the site immediately.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 px-4 text-sm font-semibold ${glassButtonPrimary}`}
        >
          <Plus size={16} aria-hidden="true" />
          New product
        </Link>
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
        <div className={`overflow-hidden ${glassCard}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
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
                    <td className={`px-4 py-3 ${p.archived ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                          {p.images[0] && (
                            <Image
                              src={p.images[0].url}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
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
                    <td className={`px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 ${p.archived ? "opacity-50" : ""}`}>{p.category}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${p.archived ? "opacity-50" : ""}`}>
                      <span className="price font-medium text-slate-900 dark:text-slate-100">
                        {formatIQD(p.priceAmount, "en")}
                      </span>
                      {p.compareAtAmount && (
                        <span className="price ms-2 text-xs text-slate-400 line-through dark:text-slate-500">
                          {formatIQD(p.compareAtAmount, "en")}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${p.archived ? "opacity-50" : ""}`}>
                      <StockBadge
                        isGiftCard={p.category === "gift-cards"}
                        totalStock={p.totalStock}
                      />
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${p.archived ? "opacity-50" : ""}`}>
                      {p.archived ? (
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
                      <ProductRowActions id={p.id} archived={p.archived} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
