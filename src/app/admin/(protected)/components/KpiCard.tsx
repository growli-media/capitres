import Link from "next/link";
import { TrendUp, TrendDown } from "@phosphor-icons/react";
import { glassCard } from "../../glass";

/** `invert`: for a metric where going up is bad news (abandoned carts),
 * so the up/down arrow's color meaning flips — up still shows TrendUp,
 * it just reads as a warning (red) instead of good news (green). */
export function DeltaBadge({ delta, invert }: { delta: number | null | undefined; invert?: boolean }) {
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

/** Shared KPI tile — Dashboard's revenue/orders/AOV/abandoned-cart row
 * and Analytics' visits/comparison/conversion row both use this, so the
 * two pages read as one system rather than two hand-rolled layouts. */
export function KpiCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
  delta,
  invertDelta,
  valueTone,
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
  /** Colors the big value itself instead of (or alongside) the small
   * delta badge — for a tile where the comparison IS the headline
   * number (e.g. "vs previous period" showing "+18%" as its own tile),
   * rather than a footnote under some other value. */
  valueTone?: "up" | "down";
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
        <span
          className={`text-2xl font-bold tracking-tight ${
            valueTone === "up"
              ? "text-emerald-600 dark:text-emerald-400"
              : valueTone === "down"
                ? "text-red-600 dark:text-red-400"
                : "text-slate-900 dark:text-slate-100"
          }`}
        >
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
