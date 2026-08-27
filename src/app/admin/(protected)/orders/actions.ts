"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { orderStore } from "@/lib/orders/store";

/**
 * Confirms a Cash on Delivery order was actually delivered and the cash
 * collected — flips it into "Delivered" (already counted as revenue)
 * rather than counting COD orders as revenue the moment they're placed,
 * since refusal/return rates at the door are real. Explicitly checks the
 * admin session here (unlike sibling actions in this codebase, which
 * only rely on the protected layout's render-time redirect) because this
 * one moves money into the revenue count.
 */
export async function markOrderDeliveredAction(ref: string): Promise<void> {
  if (!(await isAuthenticated())) return;
  await orderStore.setStatus(ref, "Delivered", "CashOnDelivery");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
