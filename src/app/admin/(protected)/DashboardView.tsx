"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CurrencyCircleDollar,
  Receipt,
  ChartLineUp,
  ShoppingCartSimple,
  Truck,
  CaretRight,
  GlobeHemisphereWest,
} from "@phosphor-icons/react";
import TimeRangeSlider from "./components/TimeRangeSlider";
import { KpiCard } from "./components/KpiCard";
import { getDashboardForRangeAction, type DashboardRangeResult } from "./dashboard-actions";
import { DEFAULT_TIME_RANGE_VALUE, type TimeRangeValue } from "@/lib/admin/time-range";
import { customerName } from "@/lib/orders/order-helpers";
import { formatIQD } from "@/lib/money";
import { glassCard } from "../glass";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Same slider-scopes-everything-below pattern as RevenueView.tsx — one
 * Server Action call per range change, previous render dimmed while
 * pending instead of a skeleton. */
export default function DashboardView({
  initial,
  openOrdersCount,
  visitsToday,
}: {
  initial: DashboardRangeResult;
  /** Cash on Delivery orders still awaiting the "Mark as delivered"
   * action — a live to-do count, not scoped to the time-range slider
   * below (an old undelivered order is just as "still to do" today). */
  openOrdersCount: number;
  /** Always "today," regardless of the range slider — same reasoning as
   * openOrdersCount above (a glance number, not a report). The
   * Analytics page itself has its own slider for any other window. */
  visitsToday: number;
}) {
  const [range, setRange] = useState<TimeRangeValue>(DEFAULT_TIME_RANGE_VALUE);
  const [data, setData] = useState<DashboardRangeResult>(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: TimeRangeValue) {
    setRange(value);
    startTransition(async () => {
      setData(await getDashboardForRangeAction(value));
    });
  }

  const { kpis, kpiDeltas, abandonedCount, recentOrders, topProducts } = data;

  return (
    <div>
      <TimeRangeSlider value={range} onChange={handleChange} pending={isPending} />

      <div className={`mt-6 grid grid-cols-2 gap-4 transition-opacity lg:grid-cols-6 ${isPending ? "opacity-60" : ""}`}>
        <KpiCard
          icon={Truck}
          label="Open orders"
          value={String(openOrdersCount)}
          href="/admin/orders?status=open"
          tone={openOrdersCount > 0 ? "alert" : undefined}
        />
        <KpiCard
          icon={GlobeHemisphereWest}
          label="Visits today"
          value={String(visitsToday)}
          href="/admin/analytics"
        />
        <KpiCard
          icon={CurrencyCircleDollar}
          label="Revenue"
          value={formatIQD(kpis.revenue, "en")}
          delta={kpiDeltas?.revenue}
        />
        <KpiCard
          icon={Receipt}
          label="Paid orders"
          value={String(kpis.orderCount)}
          delta={kpiDeltas?.orderCount}
        />
        <KpiCard
          icon={ChartLineUp}
          label="Avg. order value"
          value={formatIQD(kpis.aov, "en")}
          delta={kpiDeltas?.aov}
        />
        <KpiCard
          icon={ShoppingCartSimple}
          label="Abandoned carts"
          value={String(abandonedCount)}
          href="/admin/abandoned"
          tone={abandonedCount > 0 ? "alert" : undefined}
          delta={kpiDeltas?.abandonedCount}
          invertDelta
        />
      </div>

      <div className={`mt-8 grid gap-6 transition-opacity lg:grid-cols-3 ${isPending ? "opacity-60" : ""}`}>
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              View all
              <CaretRight size={12} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 py-10 text-center dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">No orders in this range.</p>
            </div>
          ) : (
            <>
              {/* Mobile: stacked rows, no horizontal scroll */}
              <div className={`mt-3 divide-y divide-slate-100 overflow-hidden md:hidden dark:divide-slate-800 ${glassCard}`}>
                {recentOrders.map((o) => (
                  <Link
                    key={o.ref}
                    href={`/admin/orders/${o.ref}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {customerName(o.customer)}
                      </p>
                      <p className="font-mono text-xs text-slate-400 dark:text-slate-500">{o.ref}</p>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatIQD(o.totals.total, "en")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(o.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop: table */}
              <div className={`mt-3 hidden overflow-hidden md:block ${glassCard}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recentOrders.map((o) => (
                        <tr key={o.ref}>
                          <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                            <Link href={`/admin/orders/${o.ref}`} className="hover:underline">
                              {o.ref}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                            {customerName(o.customer)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                            {formatDate(o.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-end font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                            {formatIQD(o.totals.total, "en")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top products</h2>
          {topProducts.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 py-10 text-center dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">No sales in this range.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {topProducts.map((p, i) => (
                <div
                  key={p.title}
                  className={`flex items-center justify-between px-4 py-3 ${glassCard}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{p.qty} sold</p>
                    </div>
                  </div>
                  <span className="price shrink-0 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatIQD(p.revenue, "en")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
