"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * A soft fade between pages. Keyed by the locale-stripped pathname, so
 * React mounts a fresh node — and re-triggers the CSS entrance animation —
 * on every real route change, but not on in-place updates like shop filters
 * (those only change the query string, not the pathname). Pure CSS opacity,
 * no transform: cheap, and never risks becoming a containing block for any
 * position:fixed content mounted inside a page (lightboxes, modals).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
