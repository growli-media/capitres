import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { getAdminPromoCode } from "@/lib/admin/promo-codes";
import { orderStore } from "@/lib/orders/store";
import { catalog } from "@/lib/catalog";
import { listAdminProducts } from "@/lib/admin/products";
import PromoCodeForm from "../../PromoCodeForm";
import { requirePermission } from "@/lib/admin/permissions";
import { glassTone } from "../../../../glass";

export const metadata: Metadata = { title: "Edit promo code" };

export default async function EditPromoCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requirePermission("promo_codes");
  const { code } = await params;
  const { created } = await searchParams;

  const promoCode = await getAdminPromoCode(code);
  if (!promoCode) notFound();
  const [usageCount, categories, products] = await Promise.all([
    orderStore.countByPromoCode(promoCode.code),
    catalog.getCategories(),
    listAdminProducts(),
  ]);

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
        Edit promo code
      </h1>
      {created === "1" && (
        <p className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${glassTone.success}`}>
          Promo code created.
        </p>
      )}
      <PromoCodeForm
        promoCode={promoCode}
        usageCount={usageCount}
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
