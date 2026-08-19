"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * A rise-and-fade entrance between pages. Keyed by the locale-stripped
 * pathname, so React mounts a fresh node — and re-triggers the CSS entrance
 * animation — on every real route change, but not on in-place updates like
 * shop filters (those only change the query string, not the pathname).
 *
 * The .page-fade animation uses transform (translateY), which — for as long
 * as it's applied — makes this div a containing block for any
 * position:fixed descendant (a page's lightbox, modal, dropdown...): even
 * the animation's own resting value, translateY(0), still counts as "a
 * transform" for that purpose, so leaving the class on indefinitely would
 * quietly break every fixed-position element on every page. onAnimationEnd
 * drops the class the moment the animation finishes, clearing the transform
 * so descendants go back to positioning against the real viewport.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [animating, setAnimating] = useState(true);
  return (
    <div
      key={pathname}
      className={animating ? "page-fade" : undefined}
      onAnimationEnd={() => setAnimating(false)}
    >
      {children}
    </div>
  );
}
