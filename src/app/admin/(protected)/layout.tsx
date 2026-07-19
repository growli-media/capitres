import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { getAbandonedCount } from "@/lib/admin/queries";
import AdminShell from "./AdminShell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const abandonedCount = await getAbandonedCount();

  return <AdminShell abandonedCount={abandonedCount}>{children}</AdminShell>;
}
