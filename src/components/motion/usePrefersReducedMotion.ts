"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Subscribes to prefers-reduced-motion. On the server it reports
 * "reduced" so anything gated on it (autoplaying video, continuous CSS
 * drift) never lands in the SSR HTML — a poster/static frame carries LCP,
 * and motion mounts client-side only once this resolves to false. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
