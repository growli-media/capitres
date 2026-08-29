/**
 * Shared time-range stops for the Apple-style slider used across Revenue,
 * Dashboard, Orders, Reviews, and Abandoned carts (TimeRangeSlider.tsx).
 * No "server-only" — the stop list and labels are read client-side by the
 * slider itself, not just server queries.
 *
 * Stops are spaced evenly BY INDEX along the slider, not by their actual
 * day-count — otherwise "Today" through "Last week" would be an
 * invisible sliver next to a track dominated by "Last year"/"All time".
 * Dragging dead left is always Today, dead right is always All time,
 * regardless of how many days that actually spans.
 *
 * Deliberately many stops (day-by-day near "Today", widening further out)
 * rather than the usual handful of presets — the user wants to be able to
 * dial in "any kind" of range by dragging alone; anything the stops still
 * can't hit exactly is what the From/To calendar next to the slider is
 * for.
 */
export const TIME_RANGE_STOPS = [
  { key: "today", label: "Today", days: 0 },
  { key: "1d", label: "Last day", days: 1 },
  { key: "2d", label: "Last 2 days", days: 2 },
  { key: "3d", label: "Last 3 days", days: 3 },
  { key: "4d", label: "Last 4 days", days: 4 },
  { key: "5d", label: "Last 5 days", days: 5 },
  { key: "6d", label: "Last 6 days", days: 6 },
  { key: "1w", label: "Last week", days: 7 },
  { key: "2w", label: "Last 2 weeks", days: 14 },
  { key: "3w", label: "Last 3 weeks", days: 21 },
  { key: "1m", label: "Last month", days: 30 },
  { key: "6w", label: "Last 6 weeks", days: 45 },
  { key: "2mo", label: "Last 2 months", days: 60 },
  { key: "3mo", label: "Last 3 months", days: 90 },
  { key: "4mo", label: "Last 4 months", days: 120 },
  { key: "5mo", label: "Last 5 months", days: 150 },
  { key: "6mo", label: "Last 6 months", days: 182 },
  { key: "9mo", label: "Last 9 months", days: 270 },
  { key: "1y", label: "Last year", days: 365 },
  { key: "18mo", label: "Last 18 months", days: 547 },
  { key: "2y", label: "Last 2 years", days: 730 },
  { key: "3y", label: "Last 3 years", days: 1095 },
  { key: "5y", label: "Last 5 years", days: 1825 },
  { key: "all", label: "All time", days: null },
] as const;

export type TimeRangeKey = (typeof TIME_RANGE_STOPS)[number]["key"];

export const DEFAULT_TIME_RANGE: TimeRangeKey = "1m";

export function timeRangeIndex(key: TimeRangeKey): number {
  return TIME_RANGE_STOPS.findIndex((s) => s.key === key);
}

export function timeRangeAtIndex(index: number): TimeRangeKey {
  const clamped = Math.max(0, Math.min(TIME_RANGE_STOPS.length - 1, index));
  return TIME_RANGE_STOPS[clamped].key;
}

export function timeRangeLabel(key: TimeRangeKey): string {
  return TIME_RANGE_STOPS.find((s) => s.key === key)?.label ?? key;
}

/** `start` is midnight at the start of the range's first day, local to the
 * server's clock (this app has no per-admin timezone setting) — `null`
 * for "all time". `end` is always "now", so every range includes
 * whatever has happened today so far. */
export function rangeToDates(key: TimeRangeKey): { start: Date | null; end: Date } {
  const stop = TIME_RANGE_STOPS.find((s) => s.key === key) ?? TIME_RANGE_STOPS[timeRangeIndex(DEFAULT_TIME_RANGE)];
  const end = new Date();
  if (stop.days === null) return { start: null, end };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - stop.days);
  return { start, end };
}

/**
 * A time range as picked by TimeRangeSlider — either one of the fixed
 * preset stops (dragging the slider), or an exact "From"/"To" date pair
 * (the two calendar pickers next to it) for zeroing in on a specific day
 * or custom window the preset stops don't land on exactly. Dates are
 * plain `yyyy-mm-dd` strings — the native `<input type="date">` value
 * format — not `Date` objects, so this stays trivially serializable
 * across the client -> Server Action boundary.
 */
export type TimeRangeValue =
  | { mode: "preset"; key: TimeRangeKey }
  | { mode: "custom"; start: string; end: string };

export const DEFAULT_TIME_RANGE_VALUE: TimeRangeValue = { mode: "preset", key: DEFAULT_TIME_RANGE };

/** Resolves either shape of TimeRangeValue down to the same `{ start, end }`
 * every range-aware query already accepts. A custom range's `end` is
 * pushed to the end of that calendar day (not midnight) so picking the
 * same date for both From and To still includes everything that
 * happened that day, matching "see details from a specific day". */
export function resolveTimeRange(value: TimeRangeValue): { start: Date | null; end: Date } {
  if (value.mode === "custom") {
    return {
      start: new Date(`${value.start}T00:00:00`),
      end: new Date(`${value.end}T23:59:59.999`),
    };
  }
  return rangeToDates(value.key);
}

/** Formats a Date as a plain `yyyy-mm-dd` key using its LOCAL date parts —
 * deliberately not `toISOString().slice(0, 10)`, which reads UTC fields
 * and silently rolls back to the previous calendar day for anyone in a
 * timezone ahead of UTC (Iraq is UTC+3), since local midnight is still
 * "yesterday, late evening" in UTC. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
