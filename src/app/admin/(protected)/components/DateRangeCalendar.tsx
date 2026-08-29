"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { toDateKey } from "@/lib/admin/time-range";
import { glassCard, glassIconButton } from "../../glass";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatShort(key: string): string {
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/**
 * Liquid-glass replacement for a pair of native <input type="date">s — a
 * browser's native calendar popup can't be restyled at all (only the
 * input box itself can), so an actually "beautiful" range picker has to
 * be built from scratch. Same two-click flow as the native pickers gave:
 * click a day to start, click another to finish (order doesn't matter,
 * it sorts itself out) — just drawn as a real glass month grid instead
 * of the OS's own popup.
 */
export default function DateRangeCalendar({
  start,
  end,
  onChange,
}: {
  /** null when the current selection has no lower bound (e.g. "All time"). */
  start: string | null;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const rootRef = useRef<HTMLDivElement>(null);

  function openPicker() {
    setPendingStart(null);
    setHoverKey(null);
    const anchor = end ? new Date(`${end}T00:00:00`) : new Date();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const todayKey = toDateKey(new Date());
  const rangeStart = pendingStart ?? start;
  const rangeEnd = pendingStart ? (hoverKey ?? pendingStart) : end;
  const [lo, hi] =
    rangeStart && rangeEnd
      ? rangeStart <= rangeEnd
        ? [rangeStart, rangeEnd]
        : [rangeEnd, rangeStart]
      : [null, null];

  function handleDayClick(key: string) {
    if (!pendingStart) {
      setPendingStart(key);
      return;
    }
    const s = key >= pendingStart ? pendingStart : key;
    const e = key >= pendingStart ? key : pendingStart;
    onChange(s, e);
    setPendingStart(null);
    setOpen(false);
  }

  function goMonth(delta: number) {
    let y = viewYear;
    let m = viewMonth + delta;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  const cells = buildMonthGrid(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-white/40 bg-white/50 px-3 text-xs font-medium text-slate-700 backdrop-blur-xl transition-colors hover:bg-white/70 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900/80"
      >
        <CalendarBlank size={13} />
        {start ? formatShort(start) : "Any"}
        <span className="text-slate-400 dark:text-slate-500">–</span>
        {formatShort(end)}
      </button>

      {open && (
        <div className={`absolute end-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-3xl border p-4 shadow-2xl ${glassCard}`}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              aria-label="Previous month"
              className={`h-7 w-7 cursor-pointer ${glassIconButton}`}
            >
              <CaretLeft size={13} />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{monthLabel}</span>
            <button
              type="button"
              onClick={() => goMonth(1)}
              aria-label="Next month"
              className={`h-7 w-7 cursor-pointer ${glassIconButton}`}
            >
              <CaretRight size={13} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-y-1" onMouseLeave={() => setHoverKey(null)}>
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const key = toDateKey(date);
              const isEndpoint = key === lo || key === hi;
              const inRange = !!(lo && hi && key > lo && key < hi);
              const isToday = key === todayKey;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDayClick(key)}
                  onMouseEnter={() => setHoverKey(key)}
                  className={`relative h-8 cursor-pointer text-xs transition-colors ${
                    inRange ? "bg-[#8FC7EF]/15 dark:bg-[#8FC7EF]/10" : ""
                  } ${key === lo ? "rounded-s-full" : ""} ${key === hi ? "rounded-e-full" : ""}`}
                >
                  <span
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      isEndpoint
                        ? "bg-gradient-to-b from-[#8FC7EF] to-[#5A7387] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                        : isToday
                          ? "border border-[#8FC7EF]/60 text-slate-900 dark:text-white"
                          : "text-slate-700 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/40 pt-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            <span>{pendingStart ? "Pick an end date…" : "Pick a start date…"}</span>
            <button
              type="button"
              onClick={() => {
                onChange(todayKey, todayKey);
                setOpen(false);
              }}
              className="cursor-pointer font-semibold text-[#5A7387] hover:text-[#1B3445] dark:text-[#8FC7EF] dark:hover:text-white"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
