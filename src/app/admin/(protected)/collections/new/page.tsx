import type { Metadata } from "next";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import CollectionForm from "../CollectionForm";

export const metadata: Metadata = { title: "New collection" };

export default function NewCollectionPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/collections"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Collections
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        New collection
      </h1>
      <CollectionForm mode="create" />
    </div>
  );
}
