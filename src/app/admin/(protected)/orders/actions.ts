"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { orderStore } from "@/lib/orders/store";
import { can } from "@/lib/admin/permissions";

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
  if (!(await can("orders"))) return;
  await orderStore.setStatus(ref, "Delivered", "CashOnDelivery");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/**
 * Cancels an order that hasn't been paid yet (see CANCELABLE_STATUSES in
 * CancelOrderButton.tsx — the button itself is hidden for anything else).
 * There's no refund integration in this codebase, so a paid order is
 * deliberately never reachable here — cancelling one would flip its
 * status while the customer's money stays uncollected-back.
 *
 * Shared by both Orders and Abandoned Carts (CancelOrderButton/NoteButton
 * are imported into abandoned/page.tsx too) — either permission is
 * enough, since a user with only "abandoned_carts" still needs to be able
 * to cancel/note the abandoned orders they can see.
 */
export async function cancelOrderAction(ref: string): Promise<void> {
  if (!(await isAuthenticated())) return;
  if (!(await can("orders")) && !(await can("abandoned_carts"))) return;
  await orderStore.setStatus(ref, "Cancelled");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/abandoned");
  revalidatePath("/admin");
}

export async function updateOrderNoteAction(ref: string, note: string): Promise<void> {
  if (!(await isAuthenticated())) return;
  if (!(await can("orders")) && !(await can("abandoned_carts"))) return;
  await orderStore.updateNote(ref, note.trim().slice(0, 2000));
  revalidatePath("/admin/orders");
  revalidatePath("/admin/abandoned");
}
