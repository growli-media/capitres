"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Site-wide smooth momentum scrolling (the buttery, YSL-like feel) — it
 * normalises high-resolution mouse wheels so scrolling glides instead of
 * jumping. A gentle, slightly slow duration keeps full-screen sections
 * calm to move through. Disabled for prefers-reduced-motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
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
  }, []);

  return null;
}
