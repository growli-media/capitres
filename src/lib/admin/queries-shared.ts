/**
 * Pure constants used by both server queries (queries.ts, which
 * re-exports these) and client components (OrdersView.tsx,
 * AbandonedView.tsx) — split out because queries.ts has "server-only"
 * at its top, which poisons the whole module for client bundling even
 * for plain consts with no DB access.
 */

/** Orders that count as revenue / a completed sale. "Paid" is a real Wayl
 * status (confirmed from a live webhook payload) that our own WaylStatus
 * type didn't originally include — an order can land in exactly this
 * status and never show as revenue until it's added here. */
export const PAID_STATUSES = ["Complete", "Delivered", "MockPaid", "Paid"] as const;
/** Orders that will never be paid — explicitly resolved, not abandoned. */
export const FAILED_STATUSES = ["Cancelled", "Rejected", "Returned"] as const;

/**
 * An order counts as "abandoned" once it's sat unresolved (no payment,
 * no explicit cancellation) past a grace period — long enough that
 * someone still mid-checkout doesn't show up as a lead to chase.
 */
export const ABANDONED_GRACE_MINUTES = 20;
