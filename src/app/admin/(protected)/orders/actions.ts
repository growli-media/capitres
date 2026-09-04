"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { orderStore, type Order } from "@/lib/orders/store";
import { can, requirePermission } from "@/lib/admin/permissions";
import { resolveTimeRange, type TimeRangeValue } from "@/lib/admin/time-range";
import { logAdminActivity } from "@/lib/admin/activity";

export async function getOrdersForRangeAction(range: TimeRangeValue): Promise<Order[]> {
  await requirePermission("orders");
  const { start, end } = resolveTimeRange(range);
  return orderStore.listInRange(start, end);
}

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
  await logAdminActivity(`Marked order ${ref} as delivered`);
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
  await logAdminActivity(`Cancelled order ${ref}`);
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

/** How far back "Recently deleted" looks — orders soft-deleted before
 * this just stop showing up there (they're not auto-purged; only an
 * explicit "delete forever" removes the row). */
const RECENTLY_DELETED_DAYS = 60;

/** The Orders page's trash icon — hides an order from every admin list/
 * aggregate without touching the storefront/webhook side (get()/
 * setStatus() are unfiltered — see store.ts). */
export async function deleteOrderAction(ref: string): Promise<void> {
  if (!(await isAuthenticated())) return;
  if (!(await can("orders"))) return;
  await orderStore.softDelete(ref);
  await logAdminActivity(`Deleted order ${ref}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function getDeletedOrdersAction(): Promise<Order[]> {
  await requirePermission("orders");
  const since = new Date();
  since.setDate(since.getDate() - RECENTLY_DELETED_DAYS);
  return orderStore.listDeleted(since);
}

export async function restoreOrdersAction(refs: string[]): Promise<void> {
  if (!(await isAuthenticated())) return;
  if (!(await can("orders"))) return;
  await Promise.all(refs.map((ref) => orderStore.restore(ref)));
  await logAdminActivity(`Restored ${refs.length} order${refs.length === 1 ? "" : "s"}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/** Permanent — an actual row delete. Only reachable from the Recently
 * deleted panel, on orders that are already soft-deleted. */
export async function hardDeleteOrdersAction(refs: string[]): Promise<void> {
  if (!(await isAuthenticated())) return;
  if (!(await can("orders"))) return;
  await Promise.all(refs.map((ref) => orderStore.hardDelete(ref)));
  await logAdminActivity(`Permanently deleted ${refs.length} order${refs.length === 1 ? "" : "s"}`);
}
