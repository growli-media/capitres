import type { Metadata } from "next";
import { orderStore } from "@/lib/orders/store";
import { requirePermission } from "@/lib/admin/permissions";
import { rangeToDates, DEFAULT_TIME_RANGE } from "@/lib/admin/time-range";
import OrdersView from "./OrdersView";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requirePermission("orders");
  const { start, end } = rangeToDates(DEFAULT_TIME_RANGE);
  const orders = await orderStore.listInRange(start, end);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Orders</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Newest first.</p>
      <div className="mt-6">
        <OrdersView initial={orders} />
      </div>
    </div>
  );
}
