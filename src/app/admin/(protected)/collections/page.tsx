import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminCollections } from "@/lib/admin/collections";
import CollectionRowActions from "./CollectionRowActions";

export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  const collections = await listAdminCollections();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Collections
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {collections.length} total — changes go live on the site immediately.
          </p>
        </div>
        <Link
          href="/admin/collections/new"
          className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <Plus size={16} aria-hidden="true" />
          New collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">No collections yet.</p>
          <Link
            href="/admin/collections/new"
            className="mt-4 inline-flex h-10 cursor-pointer items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Add your first collection
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 text-start font-medium">Collection</th>
                <th className="px-4 py-3 text-start font-medium">Theme</th>
                <th className="px-4 py-3 text-start font-medium">Order</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.map((c) => (
                <tr key={c.slug} className={c.archived ? "opacity-50" : undefined}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                        {c.heroImageUrl && (
                          <Image
                            src={c.heroImageUrl}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/collections/${c.slug}/edit`}
                          className="block truncate font-medium text-slate-900 hover:underline"
                        >
                          {c.titleEn}
                        </Link>
                        <span className="text-xs text-slate-400">/{c.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{c.theme}</td>
                  <td className="px-4 py-3 text-slate-600">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    {c.archived ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        Archived
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Live
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CollectionRowActions slug={c.slug} archived={c.archived} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
