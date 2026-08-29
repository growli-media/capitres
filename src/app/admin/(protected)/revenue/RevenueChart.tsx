"use client";

import { useState } from "react";
import { formatIQD } from "@/lib/money";
import type { RevenuePoint } from "@/lib/admin/revenue";

/** Single-series revenue-over-time bar chart — one hue (no legend needed
 * for one series, per the dataviz skill), 4px rounded data-ends anchored
 * to the baseline, a 2px surface gap between bars, and a per-bar hover
 * tooltip (bars are the hit target, not a crosshair — that's the line-
 * chart pattern). Plain SVG: the dataset is small (at most ~90 daily
 * points) and this stays in the codebase's existing style — no charting
 * library was installed for it. */
export default function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

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
  const gap = 4;
  const barW = Math.max(4, width / points.length - gap);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible" preserveAspectRatio="none">
        {/* Recessive baseline — the only gridline. */}
        <line
          x1="0"
          x2={width}
          y1={height - padBottom}
          y2={height - padBottom}
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="1"
        />
        {points.map((p, i) => {
          const h = max > 0 ? (p.revenue / max) * plotH : 0;
          const x = i * (barW + gap);
          const y = height - padBottom - h;
          const isHover = hover === i;
          return (
            <g key={p.bucket}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 2)}
                rx={4}
                className={`transition-[fill,opacity] ${
                  isHover
                    ? "fill-[#5A7387] dark:fill-[#8FC7EF]"
                    : "fill-[#8FC7EF] dark:fill-[#8FC7EF]/70"
                }`}
              />
              {/* Hit area bigger than the bar itself, full plot height, so
                  a thin/empty bucket is still easy to hover. */}
              <rect
                x={x - gap / 2}
                y={padTop}
                width={barW + gap}
                height={plotH + padBottom}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((v) => (v === i ? null : v))}
                onFocus={() => setHover(i)}
                onBlur={() => setHover((v) => (v === i ? null : v))}
                tabIndex={0}
                role="img"
                aria-label={`${bucketLabel(p.bucket)}: ${formatIQD(p.revenue, "en")}, ${p.orders} order${p.orders === 1 ? "" : "s"}`}
              />
            </g>
          );
        })}
      </svg>

      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute -top-2 flex -translate-x-1/2 -translate-y-full flex-col items-center"
          style={{ left: `${((hover + 0.5) * (barW + gap) / width) * 100}%` }}
        >
          <div className="rounded-lg border border-white/40 bg-white/90 px-3 py-2 text-center text-xs whitespace-nowrap shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/95">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatIQD(points[hover].revenue, "en")}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              {points[hover].orders} order{points[hover].orders === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-slate-400 dark:text-slate-500">{bucketLabel(points[hover].bucket)}</p>
          </div>
        </div>
      )}

      {/* A handful of axis labels along the baseline — first, middle,
          last — rather than one per bar, which would collide on a dense
          daily range. */}
      <div className="mt-1 flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span>{bucketLabel(points[0].bucket)}</span>
        {points.length > 2 && <span>{bucketLabel(points[Math.floor(points.length / 2)].bucket)}</span>}
        <span>{bucketLabel(points[points.length - 1].bucket)}</span>
      </div>
    </div>
  );
}

function bucketLabel(bucket: string): string {
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return bucket;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}
