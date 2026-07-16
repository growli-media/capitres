import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft, Check } from "@phosphor-icons/react/dist/ssr";
import { getAdminCollection } from "@/lib/admin/collections";
import CollectionForm from "../../CollectionForm";

export const metadata: Metadata = { title: "Edit collection" };

export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { slug } = await params;
  const { created } = await searchParams;

  const collection = await getAdminCollection(slug);
  if (!collection) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/collections"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Collections
      </Link>

      {created === "1" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={16} aria-hidden="true" />
          Collection created and live on the site.
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        Edit collection
      </h1>
      <CollectionForm mode="edit" collection={collection} />
    </div>
  );
}
