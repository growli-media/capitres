import type { Metadata } from "next";
import Link from "next/link";
import { Check, Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminCategories, isReservedCategory } from "@/lib/admin/categories";
import CategoryRowActions from "./CategoryRowActions";
import { glassCard, glassButtonPrimary, glassTone } from "../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  await requirePermission("categories");
  const [{ created }, categories] = await Promise.all([
    searchParams,
    listAdminCategories(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            The product types customers browse by. Changes go live immediately.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 px-4 text-sm font-semibold ${glassButtonPrimary}`}
        >
          <Plus size={16} aria-hidden="true" />
          New category
        </Link>
      </div>

      {created === "1" && (
        <div className={`mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${glassTone.success}`}>
          <Check size={16} aria-hidden="true" />
          Category created and live on the site.
        </div>
      )}

      {/* Mobile: stacked cards, no horizontal scroll */}
      <div className="space-y-3 md:hidden">
        {categories.map((c) => (
          <div key={c.slug} className={`p-4 ${glassCard} ${c.archived ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/categories/${c.slug}/edit`}
                  className="font-medium text-slate-900 hover:underline dark:text-slate-100"
                >
                  {c.titleEn}
                </Link>
                <span className="ms-2 text-xs text-slate-400 dark:text-slate-500">/{c.slug}</span>
              </div>
              <CategoryRowActions
                slug={c.slug}
                archived={c.archived}
                reserved={isReservedCategory(c.slug)}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">{c.productCount} products</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">Order {c.sortOrder}</span>
              {c.archived ? (
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

      {/* Desktop: table */}
      <div className={`hidden overflow-hidden md:block ${glassCard}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Category</th>
                <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Products</th>
                <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Order</th>
                <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((c) => (
                <tr key={c.slug}>
                  <td className={`px-4 py-3 whitespace-nowrap ${c.archived ? "opacity-50" : ""}`}>
                    <Link
                      href={`/admin/categories/${c.slug}/edit`}
                      className="font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {c.titleEn}
                    </Link>
                    <span className="ms-2 text-xs text-slate-400 dark:text-slate-500">/{c.slug}</span>
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 ${c.archived ? "opacity-50" : ""}`}>{c.productCount}</td>
                  <td className={`px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 ${c.archived ? "opacity-50" : ""}`}>{c.sortOrder}</td>
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
    </div>
  );
}
