"use client";

import {
  TIME_RANGE_STOPS,
  timeRangeIndex,
  timeRangeAtIndex,
  rangeToDates,
  type TimeRangeValue,
} from "@/lib/admin/time-range";
import { glassInput } from "../../glass";

const LAST_INDEX = TIME_RANGE_STOPS.length - 1;
/** Purely decorative ruler ticks drawn across the track — more of them
 * than there are real stops, so dragging reads as a continuous scrub
 * (per the user's "make it like a linear... vertical lines" direction)
 * even though only 9 positions actually snap. */
const TICK_COUNT = 40;

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatCustomLabel(start: string, end: string): string {
  const thisYear = new Date().getFullYear();
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
    if (d.getFullYear() !== thisYear) opts.year = "numeric";
    return d.toLocaleDateString("en-GB", opts);
  };
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}

/**
 * The Apple Control-Center-style time-range control — drag dead left for
 * Today, dead right for All time. No separate thumb graphic: the filled
 * portion of the pill IS the handle, same as iOS's volume/brightness
 * sliders. Built on a real <input type="range"> for native drag/touch/
 * keyboard support (arrow keys step between stops), kept full-size but
 * invisible (opacity-0, not sr-only — sr-only shrinks to 1px and would
 * kill pointer interaction) and layered on top of the custom-drawn glass
 * track so every native interaction still works.
 *
 * Two native <input type="date"> pickers sit below it for dialing in an
 * exact From/To — picking either one switches the value into "custom"
 * mode (the slider itself has no representation for an arbitrary date,
 * so it just shows full and stops tracking a stop index until the user
 * drags it again, which switches back to a preset).
 */
export default function TimeRangeSlider({
  value,
  onChange,
  pending,
}: {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
  pending?: boolean;
}) {
  const isCustom = value.mode === "custom";
  const index = isCustom ? -1 : timeRangeIndex(value.key);
  const fillPct = isCustom ? 100 : (index / LAST_INDEX) * 100;
  const label = isCustom ? formatCustomLabel(value.start, value.end) : TIME_RANGE_STOPS[index].label;

  const resolved = isCustom
    ? { start: new Date(`${value.start}T00:00:00`), end: new Date(`${value.end}T00:00:00`) }
    : rangeToDates(value.key);
  const fromValue = isCustom ? value.start : resolved.start ? toDateInputValue(resolved.start) : "";
  const toValue = isCustom ? value.end : toDateInputValue(resolved.end);
  const today = toDateInputValue(new Date());

  function handleFrom(next: string) {
    if (!next) return;
    onChange({ mode: "custom", start: next, end: toValue && toValue >= next ? toValue : next });
  }

  function handleTo(next: string) {
    if (!next) return;
    onChange({ mode: "custom", start: fromValue && fromValue <= next ? fromValue : next, end: next });
  }

  return (
    <div className={`transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="w-36 shrink-0 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <div className="relative h-10 flex-1 rounded-full border border-white/40 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_1px_3px_rgba(0,0,0,0.2)]">
          {/* Fill — the draggable "handle" is its trailing edge, not a
              separate thumb. A ruler of thin vertical ticks (every 5th
              one taller) reads as a continuous linear scale, lighting up
              as the fill passes over them. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-gradient-to-b from-[#8FC7EF] to-[#5A7387] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-[width] duration-150 ease-out"
              style={{ width: `${fillPct}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3">
              {Array.from({ length: TICK_COUNT + 1 }, (_, i) => {
                const ratio = (i / TICK_COUNT) * 100;
                const filled = ratio <= fillPct;
                const major = i % 5 === 0;
                return (
                  <span
                    key={i}
                    className={`w-px rounded-full transition-colors ${major ? "h-3.5" : "h-1.5"} ${
                      filled ? "bg-white/80" : "bg-slate-400/40 dark:bg-white/15"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={LAST_INDEX}
            step={1}
            value={Math.max(0, index)}
            onChange={(e) => onChange({ mode: "preset", key: timeRangeAtIndex(Number(e.target.value)) })}
            aria-label="Time range"
            aria-valuetext={label}
            className="absolute inset-0 h-full w-full cursor-pointer touch-none opacity-0 active:cursor-grabbing"
          />
        </div>
      </div>

      {/* Exact dates — pick a starting and ending day directly instead of
          (or in addition to) dragging the slider. */}
      <div className="mt-2 flex items-center justify-end gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <label className="flex items-center gap-1.5">
          From
          <input
            type="date"
            value={fromValue}
            max={toValue || today}
            onChange={(e) => handleFrom(e.target.value)}
            className={`h-8 px-2 text-xs ${glassInput}`}
          />
        </label>
        <label className="flex items-center gap-1.5">
          to
          <input
            type="date"
            value={toValue}
            min={fromValue || undefined}
            max={today}
            onChange={(e) => handleTo(e.target.value)}
            className={`h-8 px-2 text-xs ${glassInput}`}
          />
        </label>
      </div>
    </div>
  );
}
