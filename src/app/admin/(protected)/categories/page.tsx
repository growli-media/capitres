import type { Metadata } from "next";
import Link from "next/link";
import { Check, Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminCategories, isReservedCategory } from "@/lib/admin/categories";
import CategoryRowActions from "./CategoryRowActions";
import CategoriesTable from "./CategoriesTable";
import { CreatedToast } from "../components/CreatedToast";
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
      <CreatedToast message="Category created" />
      <CreatedToast param="deleted" message="Category deleted" />
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

      {/* Desktop: table, drag rows to reorder */}
      <CategoriesTable
        categories={categories.map((c) => ({ ...c, reserved: isReservedCategory(c.slug) }))}
      />
    </div>
  );
}
