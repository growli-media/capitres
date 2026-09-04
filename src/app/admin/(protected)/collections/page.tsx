import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminCollections } from "@/lib/admin/collections";
import CollectionRowActions from "./CollectionRowActions";
import CollectionsTable from "./CollectionsTable";
import { CreatedToast } from "../components/CreatedToast";
import { glassCard, glassButtonPrimary, glassTone } from "../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  await requirePermission("collections");
  const collections = await listAdminCollections();

  return (
    <div>
      <CreatedToast param="deleted" message="Collection deleted" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Collections
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {collections.length} total — changes go live on the site immediately.
          </p>
        </div>
        <Link
          href="/admin/collections/new"
          className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 px-4 text-sm font-semibold ${glassButtonPrimary}`}
        >
          <Plus size={16} aria-hidden="true" />
          New collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No collections yet.</p>
          <Link
            href="/admin/collections/new"
            className={`mt-4 inline-flex h-10 cursor-pointer items-center px-4 text-sm font-semibold ${glassButtonPrimary}`}
          >
            Add your first collection
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="space-y-3 md:hidden">
            {collections.map((c) => (
              <div key={c.slug} className={`p-4 ${glassCard} ${c.archived ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    {c.heroImageUrl && (
                      <Image
                        src={c.heroImageUrl}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/collections/${c.slug}/edit`}
                      className="block truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {c.titleEn}
                    </Link>
                    <span className="text-xs text-slate-400 dark:text-slate-500">/{c.slug}</span>
                  </div>
                  <CollectionRowActions slug={c.slug} archived={c.archived} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm capitalize text-slate-600 dark:text-slate-400">{c.theme}</span>
                  {c.archived ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>
                      Archived
                    </span>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>
                      Live
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table, drag rows to reorder */}
          <CollectionsTable collections={collections} />
        </>
      )}
    </div>
  );
}
