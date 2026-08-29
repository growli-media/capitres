"use server";

import { revalidatePath } from "next/cache";
import { deleteReview, setReviewApproved, listAdminReviews, type AdminReview } from "@/lib/admin/reviews";
import { requirePermission } from "@/lib/admin/permissions";
import { resolveTimeRange, type TimeRangeValue } from "@/lib/admin/time-range";

export async function getReviewsForRangeAction(range: TimeRangeValue): Promise<AdminReview[]> {
  await requirePermission("reviews");
  const { start, end } = resolveTimeRange(range);
  return listAdminReviews(start, end);
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
}

export async function approveReviewAction(id: string): Promise<void> {
  await requirePermission("reviews");
  await setReviewApproved(id, true);
  revalidateStorefront();
}

export async function unapproveReviewAction(id: string): Promise<void> {
  await requirePermission("reviews");
  await setReviewApproved(id, false);
  revalidateStorefront();
}

export async function deleteReviewAction(id: string): Promise<void> {
  await requirePermission("reviews");
  await deleteReview(id);
  revalidateStorefront();
}
