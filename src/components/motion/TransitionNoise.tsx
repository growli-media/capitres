"use client";

import { usePathname } from "@/i18n/navigation";

/**
 * A brief grain flash on every route change — reads as "something happened"
 * instantly and unmistakably, on top of the softer page-fade rise so the
 * transition can't be missed. Opacity-only (no transform), so — unlike
 * page-fade — it can never become a containing block for position:fixed
 * content; it ends at opacity:0 with pointer-events:none throughout, so
 * it's safe to leave mounted rather than needing cleanup. key={pathname}
 * remounts it fresh on every navigation to replay the flash. Must stay a
 * sibling of PageTransition, not nested inside it — nesting would put its
 * own fixed positioning inside page-fade's (transformed, while animating)
 * containing block, the exact bug this pattern caused for the review modal.
 */
export default function TransitionNoise() {
  const pathname = usePathname();
  return <div key={pathname} aria-hidden="true" className="noise-flash" />;
}
