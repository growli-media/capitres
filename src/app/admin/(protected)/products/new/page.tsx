import type { Metadata } from "next";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { catalog } from "@/lib/catalog";
import { listAdminProducts } from "@/lib/admin/products";
import ProductForm from "../ProductForm";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requirePermission("products");
  const [collections, categories, products] = await Promise.all([
    catalog.getCollections(),
    catalog.getCategories(),
    listAdminProducts(),
  ]);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Products
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        New product
      </h1>
      <ProductForm
        mode="create"
        collections={collections.map((c) => ({ slug: c.slug, titleEn: c.title.en }))}
        categories={categories.map((c) => ({ slug: c.slug, titleEn: c.title.en }))}
        otherProducts={products.map((p) => ({ slug: p.slug, titleEn: p.titleEn }))}
      />
    </div>
  );
}
