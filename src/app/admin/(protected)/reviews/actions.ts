"use server";

import { revalidatePath } from "next/cache";
import { deleteReview, setReviewApproved } from "@/lib/admin/reviews";

function revalidateStorefront() {
  revalidatePath("/", "layout");
}

export async function approveReviewAction(id: string): Promise<void> {
  await setReviewApproved(id, true);
  revalidateStorefront();
}

export async function unapproveReviewAction(id: string): Promise<void> {
  await setReviewApproved(id, false);
  revalidateStorefront();
}

export async function deleteReviewAction(id: string): Promise<void> {
  await deleteReview(id);
  revalidateStorefront();
}
