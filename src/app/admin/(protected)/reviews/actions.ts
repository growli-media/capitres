"use server";

import { revalidatePath } from "next/cache";
import { deleteReview, setReviewApproved } from "@/lib/admin/reviews";
import { requirePermission } from "@/lib/admin/permissions";

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
