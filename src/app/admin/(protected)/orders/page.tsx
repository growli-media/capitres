import type { Metadata } from "next";
import { orderStore, customerName, customerAddress } from "@/lib/orders/store";
import { PAID_STATUSES, FAILED_STATUSES } from "@/lib/admin/queries";
import { formatIQD } from "@/lib/money";
import { markOrderDeliveredAction } from "./actions";
import CancelOrderButton from "./CancelOrderButton";
import NoteButton from "./NoteButton";
import { glassCard, glassTone } from "../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Orders" };

function StatusBadge({ status }: { status: string }) {
  const isPaid = (PAID_STATUSES as readonly string[]).includes(status);
  const isFailed = (FAILED_STATUSES as readonly string[]).includes(status);
  const cls = isPaid ? glassTone.success : isFailed ? glassTone.danger : glassTone.warning;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrdersPage() {
  await requirePermission("orders");
  const orders = await orderStore.list();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Orders</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{orders.length} total, newest first.</p>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No orders yet.</p>
        </div>
      ) : (
        <div className={`mt-6 overflow-hidden ${glassCard}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Order</th>
                  <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Items</th>
                  <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-start font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => (
                  <tr key={o.ref}>
                    <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                      {o.ref}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{customerName(o.customer)}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                        {o.customer.phone}
                      </div>
                      {customerAddress(o.customer) && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {customerAddress(o.customer)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {o.lines.reduce((n, l) => n + l.qty, 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="price font-medium text-slate-900 dark:text-slate-100">
                        {formatIQD(o.totals.total, "en")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <NoteButton orderRef={o.ref} initialNote={o.adminNote ?? null} />
                        {o.status === "CashOnDelivery" && (
                          <form action={markOrderDeliveredAction.bind(null, o.ref)}>
                            <button
                              type="submit"
                              className="rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
                            >
                              Mark as delivered
                            </button>
                          </form>
                        )}
                        <CancelOrderButton orderRef={o.ref} status={o.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
