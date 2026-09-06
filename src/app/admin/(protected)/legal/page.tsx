import type { Metadata } from "next";
import Link from "next/link";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { listAdminLegalPages } from "@/lib/admin/legal-pages";
import { glassCard } from "../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Pages" };

export default async function AdminLegalPagesPage() {
  await requirePermission("legal_pages");
  const pages = await listAdminLegalPages();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Pages
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Privacy, terms, shipping & returns, and the size guide — live on the site at their usual
        addresses the moment you save.
      </p>

      <div className={`mt-6 divide-y divide-slate-100 overflow-hidden dark:divide-slate-800 ${glassCard}`}>
        {pages.map((p) => (
          <Link
            key={p.slug}
            href={`/admin/legal/${p.slug}/edit`}
            className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900 dark:text-slate-100">{p.titleEn}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">/{p.slug}</p>
            </div>
            <PencilSimple size={16} className="shrink-0 text-slate-400 dark:text-slate-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
