"use client";

import { useEffect } from "react";

/**
 * Enables full-page scroll-snapping while the homepage is mounted: the
 * document snaps to one full-screen panel at a time (see `.snap-panel` and
 * `html.snap-y` in globals.css), so a small scroll locks to the next photo
 * rather than free-scrolling. Cleaned up on navigate away.
 */
export default function HomeScrollSnap() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("snap-y");
    return () => html.classList.remove("snap-y");
  }, []);
  return null;
}
