import type { Metadata } from "next";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { catalog } from "@/lib/catalog";
import { listAdminProducts } from "@/lib/admin/products";
import PromoCodeForm from "../PromoCodeForm";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "New promo code" };

export default async function NewPromoCodePage() {
  await requirePermission("promo_codes");
  const [categories, products] = await Promise.all([catalog.getCategories(), listAdminProducts()]);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/promo-codes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Promo codes
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        New promo code
      </h1>
      <PromoCodeForm
        categories={categories.map((c) => ({ slug: c.slug, titleEn: c.title.en }))}
        products={products.map((p) => ({
          slug: p.slug,
          titleEn: p.titleEn,
          image: p.images[0]?.url ?? null,
          priceAmount: p.priceAmount,
          compareAtAmount: p.compareAtAmount,
        }))}
      />
    </div>
  );
}
