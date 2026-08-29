"use client";

import { TIME_RANGE_STOPS, timeRangeIndex, timeRangeAtIndex, type TimeRangeKey } from "@/lib/admin/time-range";

const LAST_INDEX = TIME_RANGE_STOPS.length - 1;

/**
 * The Apple Control-Center-style time-range control — drag dead left for
 * Today, dead right for All time. No separate thumb graphic: the filled
 * portion of the pill IS the handle, same as iOS's volume/brightness
 * sliders. Built on a real <input type="range"> for native drag/touch/
 * keyboard support (arrow keys step between stops), kept full-size but
 * invisible (opacity-0, not sr-only — sr-only shrinks to 1px and would
 * kill pointer interaction) and layered on top of the custom-drawn glass
 * track so every native interaction still works.
 */
export default function TimeRangeSlider({
  value,
  onChange,
  pending,
}: {
  value: TimeRangeKey;
  onChange: (key: TimeRangeKey) => void;
  pending?: boolean;
}) {
  const index = timeRangeIndex(value);
  const fillPct = (index / LAST_INDEX) * 100;

  return (
    <div className={`flex items-center gap-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <span className="w-28 shrink-0 text-sm font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
        {TIME_RANGE_STOPS[index].label}
      </span>
      <div className="relative h-10 flex-1 rounded-full border border-white/40 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_1px_3px_rgba(0,0,0,0.2)]">
        {/* Fill — the draggable "handle" is its trailing edge, not a
            separate thumb. Tick marks show the discrete stops so it
            doesn't read as a truly continuous, unlabeled drag. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-b from-[#8FC7EF] to-[#5A7387] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-[width] duration-150 ease-out"
            style={{ width: `${fillPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2.5">
            {TIME_RANGE_STOPS.map((s, i) => (
              <span
                key={s.key}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i <= index ? "bg-white/70" : "bg-slate-400/50 dark:bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={LAST_INDEX}
          step={1}
          value={index}
          onChange={(e) => onChange(timeRangeAtIndex(Number(e.target.value)))}
          aria-label="Time range"
          aria-valuetext={TIME_RANGE_STOPS[index].label}
          className="absolute inset-0 h-full w-full cursor-pointer touch-none opacity-0 active:cursor-grabbing"
        />
      </div>
    </div>
  );
}
