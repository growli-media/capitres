"use client";

import { usePathname } from "@/i18n/navigation";

const COLS = 10;
const ROWS = 6;
const STEP_MS = 22;

/**
 * The actual page-transition effect: a grid of tiles covers the screen on
 * mount and vanishes in a diagonal wave, top-left to bottom-right,
 * revealing the new page underneath. (The previous attempt was a grain
 * flash sitting on top of whatever was on screen — on the homepage that
 * read as a hero-image effect, not a transition between pages.)
 *
 * Remounted via key={pathname} so the wave replays on every route change —
 * every internal Link click (product, collection, Our Story, Contact,
 * checkout...) lands here since this renders once at the [locale] layout
 * root. Rendered as a sibling of PageTransition, not nested inside it.
 * Nothing inside this component needs position:fixed, so each tile's
 * transform (used for its collapse) never risks becoming a containing
 * block that traps something that needs the real viewport — the bug that
 * hit the review modal earlier this session.
 */
export default function RouteWipe() {
  const pathname = usePathname();
  const tiles = Array.from({ length: COLS * ROWS }, (_, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const delay = (row + col) * STEP_MS;
    return (
      <span
        key={i}
        className="route-wipe-tile"
        style={{ animationDelay: `${delay}ms` }}
      />
    );
  });

  return (
    <div key={pathname} aria-hidden="true" className="route-wipe">
      {tiles}
    </div>
  );
}
