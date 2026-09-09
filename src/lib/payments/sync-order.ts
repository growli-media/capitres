import "server-only";
import { orderStore, type Order } from "@/lib/orders/store";
import type { WaylStatus } from "./wayl";
import { PAID_STATUSES } from "@/lib/admin/queries-shared";
import { sendMetaPurchaseEvent } from "@/lib/analytics/meta-capi";

/**
 * Applies a status Wayl just reported for `order`, however it was learned
 * (a single GET /links/{referenceId} or a batch lookup) — the one place
 * that writes the update and, if it just became paid, claims and sends
 * the Meta CAPI purchase event. Safe to call from more than one sync path
 * (the confirmation page's poll, the admin "Check Wayl" button, and the
 * cron auto-sync all do): claimForMetaCapi() is itself atomic and
 * one-time, so calling this redundantly from two paths for the same
 * order never double-sends the event.
 */
export async function applyWaylStatus(
  order: Order,
  remote: { status: WaylStatus; paymentMethod: string | null; completedAt: string | null } | undefined,
): Promise<{ order: Order; changed: boolean }> {
  if (!remote || remote.status === order.status) return { order, changed: false };

  const updated = await orderStore.setStatus(
    order.ref,
    remote.status,
    remote.paymentMethod,
    remote.completedAt,
  );

  if ((PAID_STATUSES as readonly string[]).includes(remote.status)) {
    const claimed = await orderStore.claimForMetaCapi(order.ref);
    if (claimed) await sendMetaPurchaseEvent(claimed);
  }

  return { order: updated ?? order, changed: true };
}
