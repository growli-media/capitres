/** Anonymous first-party visitor id — minted once per browser by
 * src/proxy.ts (mirrors CURRENCY_COOKIE there), read by /api/track and
 * checkout. No "server-only": src/proxy.ts (Edge) and client components
 * never import this file's logic, just the two constants. */
export const VISITOR_COOKIE = "capitres_vid";
/** Matches the visits retention window (see the cron in
 * src/app/api/cron/prune-visits/route.ts) — no reason for the cookie to
 * outlive the data it identifies. */
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
