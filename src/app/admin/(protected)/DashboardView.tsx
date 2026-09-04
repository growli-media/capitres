"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CurrencyCircleDollar,
  Receipt,
  ChartLineUp,
  ShoppingCartSimple,
  CaretRight,
  TrendUp,
  TrendDown,
} from "@phosphor-icons/react";
import TimeRangeSlider from "./components/TimeRangeSlider";
import { getDashboardForRangeAction, type DashboardRangeResult } from "./dashboard-actions";
import { DEFAULT_TIME_RANGE_VALUE, type TimeRangeValue } from "@/lib/admin/time-range";
import { customerName } from "@/lib/orders/order-helpers";
import { formatIQD } from "@/lib/money";
import { glassCard } from "../glass";

/** `invert`: for a metric where going up is bad news (abandoned carts),
 * so the up/down arrow's color meaning flips — up still shows TrendUp,
 * it just reads as a warning (red) instead of good news (green). */
function DeltaBadge({ delta, invert }: { delta: number | null | undefined; invert?: boolean }) {
  if (delta === null || delta === undefined) return null;
  if (delta === 0) {
    return (
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">No change</span>
    );
  }
  const up = delta > 0;
  const good = invert ? !up : up;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-semibold ${
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      }`}
    >
      {up ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
      {up ? "+" : ""}
      {delta}%
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
  delta,
  invertDelta,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  href?: string;
  tone?: "alert";
  /** Percent change vs. the previous equal-length period — undefined
   * hides the row entirely (e.g. "all time" has no previous period),
   * null shows nothing but reserves no special case, 0 shows "No change". */
  delta?: number | null;
  invertDelta?: boolean;
}) {
  const content = (
    <div
      className={`p-5 ${
        tone === "alert"
          ? "rounded-2xl border border-amber-200/60 bg-amber-50/70 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl dark:border-amber-900/40 dark:bg-amber-950/30"
          : glassCard
      }`}
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon size={16} />
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </span>
        <DeltaBadge delta={delta} invert={invertDelta} />
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
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

/** Same slider-scopes-everything-below pattern as RevenueView.tsx — one
 * Server Action call per range change, previous render dimmed while
 * pending instead of a skeleton. */
export default function DashboardView({ initial }: { initial: DashboardRangeResult }) {
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

      <div className={`mt-6 grid grid-cols-2 gap-4 transition-opacity lg:grid-cols-4 ${isPending ? "opacity-60" : ""}`}>
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
                  <div key={o.ref} className="flex items-center justify-between gap-3 px-4 py-3">
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
                  </div>
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
                            {o.ref}
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
