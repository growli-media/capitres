import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { orderStore } from "@/lib/orders/store";
import { customerName, customerAddress } from "@/lib/orders/order-helpers";
import { PAID_STATUSES, FAILED_STATUSES } from "@/lib/admin/queries-shared";
import { formatIQD } from "@/lib/money";
import { requirePermission } from "@/lib/admin/permissions";
import CancelOrderButton from "../CancelOrderButton";
import NoteButton from "../NoteButton";
import OrderTimeline from "./OrderTimeline";
import OrderDetailActions from "./OrderDetailActions";
import PackingSlip from "./PackingSlip";
import { glassCard, glassTone } from "../../../glass";

export const metadata: Metadata = { title: "Order" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OrderDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  await requirePermission("orders");
  const { ref } = await params;
  const order = await orderStore.get(ref);
  if (!order || order.deletedAt) notFound();

  const isPaid = (PAID_STATUSES as readonly string[]).includes(order.status);
  const isFailed = (FAILED_STATUSES as readonly string[]).includes(order.status);
  const statusTone = isPaid ? glassTone.success : isFailed ? glassTone.danger : glassTone.warning;

  return (
    <>
    <div className="print:hidden">
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {order.ref}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusTone}`}>{order.status}</span>
          <NoteButton orderRef={order.ref} initialNote={order.adminNote ?? null} />
          <OrderDetailActions order={order} />
          <CancelOrderButton orderRef={order.ref} status={order.status} />
        </div>
      </div>

      <OrderTimeline status={order.status} createdAt={order.createdAt} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className={`overflow-hidden ${glassCard}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="px-4 py-3 text-start font-medium">Item</th>
                  <th className="px-4 py-3 text-start font-medium">Qty</th>
                  <th className="px-4 py-3 text-end font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.lines.map((line, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{line.title}</p>
                      {(line.size || line.color) && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {[line.size, line.color].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{line.qty}</td>
                    <td className="price px-4 py-3 text-end font-medium text-slate-900 dark:text-slate-100">
                      {formatIQD(line.unitAmount * line.qty, "en")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1.5 border-t border-slate-200 px-4 py-4 text-sm dark:border-slate-800">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="price">{formatIQD(order.totals.subtotal, "en")}</span>
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Discount</span>
                  <span className="price">−{formatIQD(order.totals.discount, "en")}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Shipping</span>
                <span className="price">{formatIQD(order.totals.shipping, "en")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                <span>Total</span>
                <span className="price">{formatIQD(order.totals.total, "en")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`p-5 ${glassCard}`}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Customer</h2>
            <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">
              {customerName(order.customer) || "—"}
            </p>
            {order.customer.phone && (
              <p className="text-sm text-slate-500 dark:text-slate-400" dir="ltr">
                {order.customer.phone}
              </p>
            )}
            {order.customer.email && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{order.customer.email}</p>
            )}
            {customerAddress(order.customer) && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {customerAddress(order.customer)}
              </p>
            )}
            {order.customer.notes && (
              <p className="mt-2 border-t border-slate-200 pt-2 text-sm text-slate-500 italic dark:border-slate-800 dark:text-slate-400">
                “{order.customer.notes}”
              </p>
            )}
          </div>

          {order.adminNote && (
            <div className={`p-5 ${glassCard}`}>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Staff note</h2>
              <p className="mt-2 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                {order.adminNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    <PackingSlip order={order} />
    </>
  );
}
