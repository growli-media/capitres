"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash } from "@phosphor-icons/react";
import { customerName, customerAddress, type Order } from "@/lib/orders/order-helpers";
import { PAID_STATUSES, FAILED_STATUSES } from "@/lib/admin/queries-shared";
import { formatIQD } from "@/lib/money";
import { markOrderDeliveredAction, getOrdersForRangeAction, deleteOrderAction } from "./actions";
import CancelOrderButton from "./CancelOrderButton";
import NoteButton from "./NoteButton";
import RecentlyDeletedPanel from "./RecentlyDeletedPanel";
import TimeRangeSlider from "../components/TimeRangeSlider";
import { useAdminToast } from "../components/AdminToastProvider";
import { DEFAULT_TIME_RANGE_VALUE, type TimeRangeValue } from "@/lib/admin/time-range";
import { glassCard, glassTone } from "../../glass";

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

export default function OrdersView({ initial }: { initial: Order[] }) {
  const [range, setRange] = useState<TimeRangeValue>(DEFAULT_TIME_RANGE_VALUE);
  const [orders, setOrders] = useState<Order[]>(initial);
  const [isPending, startTransition] = useTransition();
  const showToast = useAdminToast();

  function handleChange(value: TimeRangeValue) {
    setRange(value);
    startTransition(async () => {
      setOrders(await getOrdersForRangeAction(value));
    });
  }

  function handleDelete(ref: string) {
    setOrders((prev) => prev.filter((o) => o.ref !== ref));
    startTransition(async () => {
      await deleteOrderAction(ref);
      showToast("Order deleted");
    });
  }

  function handleMarkDelivered(ref: string) {
    startTransition(async () => {
      await markOrderDeliveredAction(ref);
      showToast("Order marked as delivered");
    });
  }

  function handleRestored() {
    startTransition(async () => {
      setOrders(await getOrdersForRangeAction(range));
    });
  }

  return (
    <div>
      <TimeRangeSlider value={range} onChange={handleChange} pending={isPending} />
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{orders.length} in this range.</p>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No orders in this range.</p>
        </div>
      ) : (
        <div className={`transition-opacity ${isPending ? "opacity-60" : ""}`}>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="mt-6 space-y-3 md:hidden">
            {orders.map((o) => (
              <div key={o.ref} className={`p-4 ${glassCard}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/orders/${o.ref}`}
                      className="font-mono text-xs font-medium text-slate-900 hover:underline dark:text-slate-100"
                    >
                      {o.ref}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatDate(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{customerName(o.customer)}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                    {o.customer.phone}
                  </div>
                  {customerAddress(o.customer) && (
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {customerAddress(o.customer)}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {o.lines.reduce((n, l) => n + l.qty, 0)} items —{" "}
                    <span className="price font-medium text-slate-900 dark:text-slate-100">
                      {formatIQD(o.totals.total, "en")}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <NoteButton orderRef={o.ref} initialNote={o.adminNote ?? null} />
                  {o.status === "CashOnDelivery" && (
                    <button
                      type="button"
                      onClick={() => handleMarkDelivered(o.ref)}
                      className="rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
                    >
                      Mark as delivered
                    </button>
                  )}
                  <CancelOrderButton orderRef={o.ref} status={o.status} />
                  <button
                    type="button"
                    onClick={() => handleDelete(o.ref)}
                    aria-label="Delete order"
                    title="Delete order"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className={`mt-6 hidden overflow-hidden md:block ${glassCard}`}>
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
                        <Link href={`/admin/orders/${o.ref}`} className="hover:underline">
                          {o.ref}
                        </Link>
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
                            <button
                              type="button"
                              onClick={() => handleMarkDelivered(o.ref)}
                              className="rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
                            >
                              Mark as delivered
                            </button>
                          )}
                          <CancelOrderButton orderRef={o.ref} status={o.status} />
                          <button
                            type="button"
                            onClick={() => handleDelete(o.ref)}
                            aria-label="Delete order"
                            title="Delete order"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <RecentlyDeletedPanel onRestored={handleRestored} />
    </div>
  );
}
