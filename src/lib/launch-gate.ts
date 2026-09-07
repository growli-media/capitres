/**
 * Temporary pre-launch lock — shows a countdown instead of the storefront
 * until LAUNCH_AT_UTC. Delete this file, its one call site in
 * src/app/[locale]/layout.tsx, and src/components/launch/ once the site
 * has actually gone live; nothing else in the codebase depends on it.
 *
 * 2026-09-07T15:00:00Z = 18:00 Asia/Baghdad on 2026-09-07 — Baghdad is a
 * fixed UTC+3 year-round (no DST since 2008), so this never needs
 * adjusting for the date it's set to.
 */
export const LAUNCH_AT_UTC = "2026-09-07T15:00:00.000Z";

export function isBeforeLaunch(now: Date = new Date()): boolean {
  return now.getTime() < new Date(LAUNCH_AT_UTC).getTime();
}
