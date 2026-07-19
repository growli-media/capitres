import type { Metadata } from "next";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { catalog } from "@/lib/catalog";
import ProductForm from "../ProductForm";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const [collections, categories] = await Promise.all([
    catalog.getCollections(),
    catalog.getCategories(),
  ]);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Products
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        New product
      </h1>
      <ProductForm
        mode="create"
        collections={collections.map((c) => ({ slug: c.slug, titleEn: c.title.en }))}
        categories={categories.map((c) => ({ slug: c.slug, titleEn: c.title.en }))}
      />
    </div>
  );
}
