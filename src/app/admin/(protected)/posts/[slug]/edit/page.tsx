import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft, Check } from "@phosphor-icons/react/dist/ssr";
import { getAdminPost } from "@/lib/admin/posts";
import { listAdminProducts } from "@/lib/admin/products";
import PostForm from "../../PostForm";
import { CreatedToast } from "../../../components/CreatedToast";
import { glassTone } from "../../../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requirePermission("posts");
  const { slug } = await params;
  const { created } = await searchParams;

  const [post, products] = await Promise.all([getAdminPost(slug), listAdminProducts()]);
  if (!post) notFound();

  return (
    <div className="max-w-3xl">
      <CreatedToast message="Post created" />
      <Link
        href="/admin/posts"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Journal
      </Link>

      {created === "1" && (
        <div className={`mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${glassTone.success}`}>
          <Check size={16} aria-hidden="true" />
          {post.published ? "Post published and live on /blog." : "Post saved as a draft."}
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Edit post
      </h1>
      <PostForm
        mode="edit"
        post={post}
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
