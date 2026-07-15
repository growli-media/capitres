import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { getAbandonedCount } from "@/lib/admin/queries";
import AdminNav from "./AdminNav";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const abandonedCount = await getAbandonedCount();

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-e border-slate-200 bg-white md:block">
        <AdminNav abandonedCount={abandonedCount} />
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
