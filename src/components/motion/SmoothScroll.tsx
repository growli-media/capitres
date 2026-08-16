"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "@/i18n/navigation";

/**
 * Site-wide smooth momentum scrolling (the buttery feel) — it normalises
 * high-resolution mouse wheels so scrolling glides instead of jumping.
 * Disabled for prefers-reduced-motion and on the homepage, which runs its
 * own locked full-page controller (<FullPageScroll>) that owns the wheel.
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === "/") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
    });

    let frame: number;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
