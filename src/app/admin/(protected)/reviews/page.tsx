import type { Metadata } from "next";
import { listAdminReviews } from "@/lib/admin/reviews";
import { requirePermission } from "@/lib/admin/permissions";
import { rangeToDates, DEFAULT_TIME_RANGE } from "@/lib/admin/time-range";
import ReviewsView from "./ReviewsView";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await requirePermission("reviews");
  const { start, end } = rangeToDates(DEFAULT_TIME_RANGE);
  const reviews = await listAdminReviews(start, end);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Reviews</h1>
      <div className="mt-6">
        <ReviewsView initial={reviews} />
      </div>
    </div>
  );
}
