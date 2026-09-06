import type { Metadata } from "next";
import { orderStore } from "@/lib/orders/store";
import { requirePermission } from "@/lib/admin/permissions";
import { rangeToDates, DEFAULT_TIME_RANGE } from "@/lib/admin/time-range";
import OrdersView from "./OrdersView";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("orders");
  const { status } = await searchParams;
  const openOnly = status === "open";

  // Open orders aren't time-scoped — an old undelivered Cash on Delivery
  // order is exactly as "still to do" as one from today — so this pulls
  // the full (soft-delete-excluded, 500-cap) list and filters in memory
  // rather than reusing the range-scoped query the default view uses.
  let orders;
  if (openOnly) {
    orders = (await orderStore.list()).filter((o) => o.status === "CashOnDelivery");
  } else {
    const { start, end } = rangeToDates(DEFAULT_TIME_RANGE);
    orders = await orderStore.listInRange(start, end);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Orders</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {openOnly ? "Cash on Delivery orders awaiting delivery confirmation." : "Newest first."}
      </p>
      <div className="mt-6">
        <OrdersView initial={orders} openOnly={openOnly} />
      </div>
    </div>
  );
}
