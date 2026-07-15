import type { Metadata } from "next";
import { orderStore } from "@/lib/orders/store";
import { PAID_STATUSES, FAILED_STATUSES } from "@/lib/admin/queries";
import { formatIQD } from "@/lib/money";

export const metadata: Metadata = { title: "Orders" };

function StatusBadge({ status }: { status: string }) {
  const isPaid = (PAID_STATUSES as readonly string[]).includes(status);
  const isFailed = (FAILED_STATUSES as readonly string[]).includes(status);
  const cls = isPaid
    ? "bg-emerald-50 text-emerald-700"
    : isFailed
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-700";
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
  const orders = await orderStore.list();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
      <p className="mt-1 text-sm text-slate-500">{orders.length} total, newest first.</p>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">No orders yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 text-start font-medium">Order</th>
                <th className="px-4 py-3 text-start font-medium">Date</th>
                <th className="px-4 py-3 text-start font-medium">Customer</th>
                <th className="px-4 py-3 text-start font-medium">Items</th>
                <th className="px-4 py-3 text-start font-medium">Total</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.ref}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                    {o.ref}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{o.customer.fullName}</div>
                    <div className="text-xs text-slate-400" dir="ltr">
                      {o.customer.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {o.lines.reduce((n, l) => n + l.qty, 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="price font-medium text-slate-900">
                      {formatIQD(o.totals.total, "en")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
