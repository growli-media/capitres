"use client";

import { useId, useState } from "react";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "@phosphor-icons/react";
import { formatIQD } from "@/lib/money";
import type { RevenuePoint } from "@/lib/admin/revenue";

/** Stock-ticker style: a trend-colored line + gradient area instead of
 * bars, an arrowhead capping the line's last point instead of a plain
 * dot, and a trend badge (arrow + % change from first point to last)
 * above it — the explicit "make it like a stock market chart... make it
 * look like arrows" direction, which deliberately breaks from the
 * dataviz skill's single-brand-hue default: direction (up/down) is the
 * whole point of a ticker, so green/red carries real meaning here. Click
 * a point (not just hover) to pin its exact numbers — hover still works
 * for a quick scan, but click is what sticks around and what works on
 * touch, where there's no hover at all. */
export default function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const gradientId = useId();

  if (points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        No revenue in this range.
      </div>
    );
  }

  const width = 720;
  const height = 220;
  const padTop = 16;
  const padBottom = 28;
  const plotH = height - padTop - padBottom;
  const max = Math.max(...points.map((p) => p.revenue), 1);

  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const xAt = (i: number) => (points.length > 1 ? i * stepX : width / 2);
  const yAt = (i: number) => height - padBottom - (points[i].revenue / max) * plotH;

  const first = points[0].revenue;
  const last = points[points.length - 1].revenue;
  const pctChange = first > 0 ? ((last - first) / first) * 100 : last > 0 ? 100 : 0;
  const trend: "up" | "down" | "flat" = pctChange > 0.05 ? "up" : pctChange < -0.05 ? "down" : "flat";
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-slate-500 dark:text-slate-400";
  const strokeClass =
    trend === "up" ? "stroke-emerald-500 dark:stroke-emerald-400" : trend === "down" ? "stroke-red-500 dark:stroke-red-400" : "stroke-[#5A7387] dark:stroke-[#8FC7EF]";
  const fillClass =
    trend === "up" ? "fill-emerald-500 dark:fill-emerald-400" : trend === "down" ? "fill-red-500 dark:fill-red-400" : "fill-[#5A7387] dark:fill-[#8FC7EF]";
  const gradientStop =
    trend === "up" ? "rgb(16 185 129)" : trend === "down" ? "rgb(239 68 68)" : "rgb(90 115 135)";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : ArrowRight;

  const linePath = points.map((_, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(i)}`).join(" ");
  const areaPath = `${linePath} L${xAt(points.length - 1)},${height - padBottom} L${xAt(0)},${height - padBottom} Z`;

  // Arrowhead at the last point, rotated to match the final segment's
  // exit angle — a literal "arrow" tip on the line itself, on top of the
  // trend badge above the chart.
  const n = points.length;
  const angle = n > 1 ? Math.atan2(yAt(n - 1) - yAt(n - 2), xAt(n - 1) - xAt(n - 2)) * (180 / Math.PI) : 0;

  const active = selected ?? hover;

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-end gap-1.5">
        <div className={`flex items-center gap-1 rounded-full bg-current/10 px-2.5 py-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon size={13} weight="bold" />
          {trend === "flat" ? "Flat" : `${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}%`}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientStop} stopOpacity="0.28" />
            <stop offset="100%" stopColor={gradientStop} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive baseline — the only gridline. */}
        <line x1="0" x2={width} y1={height - padBottom} y2={height - padBottom} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" className={strokeClass} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => {
          const isLast = i === n - 1;
          const isActive = active === i;
          const x = xAt(i);
          const y = yAt(i);
          return (
            <g key={p.bucket}>
              {isLast ? (
                // Arrowhead cap on the final point instead of a plain dot.
                <polygon
                  points="0,-6 6,0 0,6 2,0"
                  transform={`translate(${x},${y}) rotate(${angle})`}
                  className={fillClass}
                />
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 5 : 3}
                  className={`${fillClass} stroke-white transition-[r] dark:stroke-slate-900`}
                  strokeWidth="1.5"
                />
              )}
              {/* Hit area bigger than the marker, full plot height, so a
                  thin/short point is still easy to click or hover. */}
              <rect
                x={x - stepX / 2}
                y={padTop}
                width={points.length > 1 ? stepX : width}
                height={plotH + padBottom}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((v) => (v === i ? null : v))}
                onClick={() => setSelected((v) => (v === i ? null : i))}
                onFocus={() => setHover(i)}
                onBlur={() => setHover((v) => (v === i ? null : v))}
                tabIndex={0}
                role="button"
                aria-pressed={selected === i}
                className="cursor-pointer"
                aria-label={`${bucketLabel(p.bucket)}: ${formatIQD(p.revenue, "en")}, ${p.orders} order${p.orders === 1 ? "" : "s"}`}
              />
            </g>
          );
        })}
      </svg>

      {active !== null && points[active] && (
        <div
          className="pointer-events-none absolute -top-2 flex -translate-x-1/2 -translate-y-full flex-col items-center"
          style={{ left: `${(xAt(active) / width) * 100}%` }}
        >
          <div
            className={`rounded-lg border px-3 py-2 text-center text-xs whitespace-nowrap shadow-lg backdrop-blur-xl ${
              selected === active
                ? "border-[#8FC7EF]/60 bg-white/95 dark:border-[#8FC7EF]/40 dark:bg-slate-800"
                : "border-white/40 bg-white/90 dark:border-white/10 dark:bg-slate-800/95"
            }`}
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatIQD(points[active].revenue, "en")}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              {points[active].orders} order{points[active].orders === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-slate-400 dark:text-slate-500">{bucketLabel(points[active].bucket)}</p>
          </div>
        </div>
      )}

      {/* A handful of axis labels along the baseline — first, middle,
          last — rather than one per point, which would collide on a
          dense daily range. */}
      <div className="mt-1 flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span>{bucketLabel(points[0].bucket)}</span>
        {points.length > 2 && <span>{bucketLabel(points[Math.floor(points.length / 2)].bucket)}</span>}
        <span>{bucketLabel(points[points.length - 1].bucket)}</span>
      </div>

      {selected === null && (
        <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Click a point on the chart to see that day&rsquo;s numbers.
        </p>
      )}
    </div>
  );
}

function bucketLabel(bucket: string): string {
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return bucket;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}
