import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { getAdminLegalPage } from "@/lib/admin/legal-pages";
import LegalPageForm from "../../LegalPageForm";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Edit page" };

export default async function EditLegalPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePermission("legal_pages");
  const { slug } = await params;

  const page = await getAdminLegalPage(slug);
  if (!page) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/legal"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Pages
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Edit page
      </h1>
      <LegalPageForm page={page} />
    </div>
  );
}
