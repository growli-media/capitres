import type { Metadata } from "next";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import CategoryForm from "../CategoryForm";
import { listAdminCategories } from "@/lib/admin/categories";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requirePermission("categories");
  const categories = await listAdminCategories();
  const nextSortOrder = categories.length
    ? Math.max(...categories.map((c) => c.sortOrder)) + 1
    : 0;
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/categories"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Categories
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        New category
      </h1>
      <CategoryForm mode="create" nextSortOrder={nextSortOrder} />
    </div>
  );
}
