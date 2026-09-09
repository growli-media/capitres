"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackVisitEvent } from "@/lib/analytics/track-visit";

function TrackVisit() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackVisitEvent("page_view");
  }, [pathname, searchParams]);

  return null;
}

/** First-party sibling of PageviewTracker.tsx (GA4) — powers the admin
 * Analytics section's own visit/activity log, independent of any
 * third-party script being configured. */
export default function VisitTracker() {
  return (
    <Suspense fallback={null}>
      <TrackVisit />
    </Suspense>
  );
}
