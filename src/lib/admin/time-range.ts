/**
 * Shared time-range stops for the Apple-style slider used across Revenue,
 * Dashboard, Orders, Reviews, and Abandoned carts (TimeRangeSlider.tsx).
 * No "server-only" — the stop list and labels are read client-side by the
 * slider itself, not just server queries.
 *
 * Stops are spaced evenly BY INDEX along the slider, not by their actual
 * day-count — otherwise "Today" through "Last 7 days" would be an
 * invisible sliver next to a track dominated by "Last year"/"All time".
 * Dragging dead left is always Today, dead right is always All time,
 * regardless of how many days that actually spans.
 */
export const TIME_RANGE_STOPS = [
  { key: "today", label: "Today", days: 0 },
  { key: "3d", label: "Last 3 days", days: 3 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "14d", label: "Last 14 days", days: 14 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "6m", label: "Last 6 months", days: 182 },
  { key: "1y", label: "Last year", days: 365 },
  { key: "all", label: "All time", days: null },
] as const;

export type TimeRangeKey = (typeof TIME_RANGE_STOPS)[number]["key"];

export const DEFAULT_TIME_RANGE: TimeRangeKey = "30d";

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
  const stop = TIME_RANGE_STOPS.find((s) => s.key === key) ?? TIME_RANGE_STOPS[4];
  const end = new Date();
  if (stop.days === null) return { start: null, end };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - stop.days);
  return { start, end };
}
