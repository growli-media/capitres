"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import Snap from "lenis/snap";
import { usePathname } from "@/i18n/navigation";

/**
 * Site-wide smooth momentum scrolling (the buttery, YSL-like feel). No wheel
 * hijacking — you scroll freely and it glides. On the homepage a Lenis Snap
 * gently settles onto each full-screen section, so scrolling flows through the
 * photos one at a time and eases to rest on each, exactly like ysl.com.
 * Disabled for prefers-reduced-motion.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    // Homepage: photo-album scroll — one scroll advances exactly one
    // full-screen section (lock), which covers the previous from the bottom
    // (the sections are CSS-sticky). Low debounce so it reacts as soon as you
    // scroll; smooth, deliberate glide so it isn't jumpy.
    let snap: Snap | undefined;
    if (pathname === "/") {
      snap = new Snap(lenis, {
        type: "lock",
        duration: 0.9,
        debounce: 50,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
      const main = document.getElementById("main");
      const sections = main
        ? Array.from(main.querySelectorAll<HTMLElement>("section"))
        : [];
      const footer = document.querySelector<HTMLElement>("footer");
      for (const el of footer ? [...sections, footer] : sections) {
        snap.addElement(el, { align: "start" });
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      snap?.destroy();
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
