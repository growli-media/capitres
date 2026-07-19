import type { Metadata } from "next";
import Link from "next/link";
import { Check, Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminCategories, isReservedCategory } from "@/lib/admin/categories";
import CategoryRowActions from "./CategoryRowActions";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ created }, categories] = await Promise.all([
    searchParams,
    listAdminCategories(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            The product types customers browse by. Changes go live immediately.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <Plus size={16} aria-hidden="true" />
          New category
        </Link>
      </div>

      {created === "1" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={16} aria-hidden="true" />
          Category created and live on the site.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 text-start font-medium">Category</th>
              <th className="px-4 py-3 text-start font-medium">Products</th>
              <th className="px-4 py-3 text-start font-medium">Order</th>
              <th className="px-4 py-3 text-start font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c) => (
              <tr key={c.slug} className={c.archived ? "opacity-50" : undefined}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/categories/${c.slug}/edit`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {c.titleEn}
                  </Link>
                  <span className="ms-2 text-xs text-slate-400">/{c.slug}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.productCount}</td>
                <td className="px-4 py-3 text-slate-600">{c.sortOrder}</td>
                <td className="px-4 py-3">
                  {c.archived ? (
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
                  <CategoryRowActions
                    slug={c.slug}
                    archived={c.archived}
                    reserved={isReservedCategory(c.slug)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
