"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview } from "@/lib/analytics/track";

function TrackRouteChanges() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    pageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

/** GA4's own auto-pageview only fires on the very first hard load — every
 * client-side route change after that needs an explicit page_view event,
 * or "time on page" / session data silently stops reflecting navigation. */
export default function PageviewTracker() {
  return (
    <Suspense fallback={null}>
      <TrackRouteChanges />
    </Suspense>
  );
}
