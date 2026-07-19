import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft, Check } from "@phosphor-icons/react/dist/ssr";
import { catalog } from "@/lib/catalog";
import { getAdminProduct } from "@/lib/admin/products";
import ProductForm from "../../ProductForm";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const [result, collections, categories] = await Promise.all([
    getAdminProduct(id),
    catalog.getCollections(),
    catalog.getCategories(),
  ]);
  if (!result) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Products
      </Link>

      {created === "1" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={16} aria-hidden="true" />
          Product created and live on the site.
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        Edit product
      </h1>
      <ProductForm
        mode="edit"
        product={result.product}
        variants={result.variants}
        collections={collections.map((c) => ({ slug: c.slug, titleEn: c.title.en }))}
        categories={categories.map((c) => ({ slug: c.slug, titleEn: c.title.en }))}
      />
    </div>
  );
}
