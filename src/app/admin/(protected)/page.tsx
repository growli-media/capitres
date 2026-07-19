import type { Metadata } from "next";
import Link from "next/link";
import {
  CurrencyCircleDollar,
  Receipt,
  ChartLineUp,
  ShoppingCartSimple,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { Quotes } from "@phosphor-icons/react/dist/ssr";
import { getDashboardKpis, getTopProducts } from "@/lib/admin/dashboard";
import { getAbandonedCount } from "@/lib/admin/queries";
import { orderStore } from "@/lib/orders/store";
import { formatIQD } from "@/lib/money";
import { randomQuote } from "@/lib/admin/quotes";

export const metadata: Metadata = { title: "Dashboard" };

function KpiCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  href?: string;
  tone?: "alert";
}) {
  const content = (
    <div
      className={`rounded-xl border p-5 ${
        tone === "alert"
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
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

export default async function AdminDashboardPage() {
  const [kpis, topProducts, abandonedCount, recentOrders] = await Promise.all([
    getDashboardKpis(),
    getTopProducts(5),
    getAbandonedCount(),
    orderStore.list(),
  ]);
  const quote = randomQuote();

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-5 text-white">
        <Quotes size={22} weight="fill" className="mb-2 text-white/40" aria-hidden="true" />
        <p
          dir="rtl"
          lang="ar"
          className="text-xl leading-loose md:text-2xl"
          style={{ fontFamily: '"Noto Naskh Arabic", "Geeza Pro", "Al Bayan", serif' }}
        >
          {quote.arabic}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
          {quote.text}
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/50">
          {quote.author}
        </p>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Revenue counts paid orders only. Numbers update as soon as an order&rsquo;s
        status changes.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={CurrencyCircleDollar} label="Revenue" value={formatIQD(kpis.revenue, "en")} />
        <KpiCard icon={Receipt} label="Paid orders" value={String(kpis.orderCount)} />
        <KpiCard icon={ChartLineUp} label="Avg. order value" value={formatIQD(kpis.aov, "en")} />
        <KpiCard
          icon={ShoppingCartSimple}
          label="Abandoned carts"
          value={String(abandonedCount)}
          href="/admin/abandoned"
          tone={abandonedCount > 0 ? "alert" : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              View all
              <CaretRight size={12} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 py-10 text-center">
              <p className="text-sm text-slate-500">No orders yet.</p>
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.slice(0, 6).map((o) => (
                    <tr key={o.ref}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {o.ref}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {o.customer.fullName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-end font-medium text-slate-900">
                        {formatIQD(o.totals.total, "en")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Top products</h2>
          {topProducts.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 py-10 text-center">
              <p className="text-sm text-slate-500">No sales yet.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {topProducts.map((p, i) => (
                <div
                  key={p.title}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {p.title}
                      </p>
                      <p className="text-xs text-slate-400">{p.qty} sold</p>
                    </div>
                  </div>
                  <span className="price shrink-0 text-sm font-medium text-slate-900">
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
