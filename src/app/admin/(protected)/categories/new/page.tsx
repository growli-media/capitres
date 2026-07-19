import type { Metadata } from "next";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import CategoryForm from "../CategoryForm";

export const metadata: Metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/categories"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Categories
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        New category
      </h1>
      <CategoryForm mode="create" />
    </div>
  );
}
