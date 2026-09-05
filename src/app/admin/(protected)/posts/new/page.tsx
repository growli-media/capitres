import type { Metadata } from "next";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { listAdminProducts } from "@/lib/admin/products";
import PostForm from "../PostForm";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await requirePermission("posts");
  const products = await listAdminProducts();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/posts"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Journal
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        New post
      </h1>
      <PostForm
        mode="create"
        otherProducts={products.map((p) => ({
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
