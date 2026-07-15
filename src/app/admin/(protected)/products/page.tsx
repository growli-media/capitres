import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminProducts } from "@/lib/admin/products";
import { formatIQD } from "@/lib/money";
import ProductRowActions from "./ProductRowActions";

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
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        Digital
      </span>
    );
  }
  if (totalStock === 0) {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Sold out
      </span>
    );
  }
  if (totalStock <= 10) {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Low — {totalStock} left
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      In stock — {totalStock}
    </span>
  );
}

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {products.length} total — changes go live on the site immediately.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <Plus size={16} aria-hidden="true" />
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">No products yet.</p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-flex h-10 cursor-pointer items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 text-start font-medium">Product</th>
                <th className="px-4 py-3 text-start font-medium">Category</th>
                <th className="px-4 py-3 text-start font-medium">Price</th>
                <th className="px-4 py-3 text-start font-medium">Stock</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={p.archived ? "opacity-50" : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
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
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="block truncate font-medium text-slate-900 hover:underline"
                        >
                          {p.titleEn}
                        </Link>
                        <span className="text-xs text-slate-400">/{p.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className="price font-medium text-slate-900">
                      {formatIQD(p.priceAmount, "en")}
                    </span>
                    {p.compareAtAmount && (
                      <span className="price ms-2 text-xs text-slate-400 line-through">
                        {formatIQD(p.compareAtAmount, "en")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge
                      isGiftCard={p.category === "gift-cards"}
                      totalStock={p.totalStock}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {p.archived ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        Archived
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Live
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions id={p.id} archived={p.archived} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
