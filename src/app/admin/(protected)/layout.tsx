import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { getAbandonedCount } from "@/lib/admin/queries";
import { getPendingReviewsCount } from "@/lib/admin/reviews";
import AdminShell from "./AdminShell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const [abandonedCount, pendingReviewsCount] = await Promise.all([
    getAbandonedCount(),
    getPendingReviewsCount(),
  ]);
  const badgeCounts = {
    "/admin/abandoned": abandonedCount,
    "/admin/reviews": pendingReviewsCount,
  };

  return <AdminShell badgeCounts={badgeCounts}>{children}</AdminShell>;
}
