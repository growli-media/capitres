import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { getAbandonedCount } from "@/lib/admin/queries";
import { getPendingReviewsCount } from "@/lib/admin/reviews";
import { getAccessLevel } from "@/lib/admin/permissions";
import AdminShell from "./AdminShell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const [abandonedCount, pendingReviewsCount, access] = await Promise.all([
    getAbandonedCount(),
    getPendingReviewsCount(),
    getAccessLevel(),
  ]);
  const badgeCounts = {
    "/admin/abandoned": abandonedCount,
    "/admin/reviews": pendingReviewsCount,
  };

  return (
    <AdminShell badgeCounts={badgeCounts} access={access}>
      {children}
    </AdminShell>
  );
}
