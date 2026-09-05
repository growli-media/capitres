import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminPosts } from "@/lib/admin/posts";
import { formatDateNumeric } from "@/lib/dates";
import PostRowActions from "./PostRowActions";
import { CreatedToast } from "../components/CreatedToast";
import { glassCard, glassButtonPrimary, glassTone } from "../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Journal" };

export default async function AdminPostsPage() {
  await requirePermission("posts");
  const posts = await listAdminPosts();

  return (
    <div>
      <CreatedToast param="deleted" message="Post deleted" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Journal
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {posts.length} total — published posts go live on /blog immediately.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 px-4 text-sm font-semibold ${glassButtonPrimary}`}
        >
          <Plus size={16} aria-hidden="true" />
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No posts yet.</p>
          <Link
            href="/admin/posts/new"
            className={`mt-4 inline-flex h-10 cursor-pointer items-center px-4 text-sm font-semibold ${glassButtonPrimary}`}
          >
            Write your first post
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="space-y-3 md:hidden">
            {posts.map((p) => (
              <div key={p.slug} className={`p-4 ${glassCard}`}>
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    {p.cover.url && (
                      <Image src={p.cover.url} alt="" fill sizes="80px" className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/posts/${p.slug}/edit`}
                      className="block truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {p.titleEn}
                    </Link>
                    <span className="text-xs text-slate-400 dark:text-slate-500">/{p.slug}</span>
                  </div>
                  <PostRowActions slug={p.slug} published={p.published} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDateNumeric(p.postDate, "en")}
                  </span>
                  {p.published ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>
                      Published
                    </span>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>
                      Draft
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: plain table — posts sort by date, no manual reordering */}
          <div className={`hidden overflow-x-auto md:block ${glassCard}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-start text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="px-4 py-3 text-start">Post</th>
                  <th className="px-4 py-3 text-start">Date</th>
                  <th className="px-4 py-3 text-start">Author</th>
                  <th className="px-4 py-3 text-start">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.slug} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                          {p.cover.url && (
                            <Image src={p.cover.url} alt="" fill sizes="64px" className="object-cover" unoptimized />
                          )}
                        </div>
                        <Link
                          href={`/admin/posts/${p.slug}/edit`}
                          className="min-w-0 truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
                        >
                          {p.titleEn}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDateNumeric(p.postDate, "en")}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.author}</td>
                    <td className="px-4 py-3">
                      {p.published ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>
                          Published
                        </span>
                      ) : (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PostRowActions slug={p.slug} published={p.published} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
