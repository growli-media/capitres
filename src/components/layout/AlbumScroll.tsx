"use client";

import { useEffect, useRef, type ReactNode } from "react";

const DURATION = 500; // ms — compositor-only, so this can stay snappy and still read smooth
const THRESHOLD = 24; // accumulated wheel delta needed to trigger an advance
const SETTLE = 40; // ms pause after landing before accepting the next advance
const FOOTER_KICK = 40; // px — real scroll nudge that hands off to the footer
const EPSILON = 4; // px — "are we still at the top of the album" tolerance

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Homepage "photo album": the hero + full-bleed panels are stacked in a
 * viewport clipped to 100svh and moved with a CSS transform on their own
 * layer — compositor-only, no scroll/layout thrash — so each photo glides in
 * completely and locks, like a photo-album page turn. This is the technique
 * behind buttery full-screen-section sites: never animate window.scrollTo in
 * a loop, translate a layer instead.
 *
 * The document's real scroll position never moves while inside the album
 * (wheel is captured whenever scrollY is ~0); scrolling past the last photo
 * hands off to normal page scroll to reveal the footer, and scrolling back
 * up from the footer re-enters the album on its last photo.
 *
 * Desktop + motion only — touch/mobile and reduced-motion get the plain
 * fallback: children stack in normal flow, unclipped, natively scrollable.
 */
export default function AlbumScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const desktopMq = window.matchMedia("(min-width: 1024px)");
    let clipped = false;
    let count = 0;
    let index = 0;
    let animating = false;
    let accum = 0;
    let raf = 0;

    const applyTransform = (i: number) => {
      track.style.transform = `translate3d(0, ${-i * viewport.clientHeight}px, 0)`;
    };

    const animateTo = (i: number) => {
      const from = index;
      index = i;
      animating = true;
      const startY = -from * viewport.clientHeight;
      const endY = -i * viewport.clientHeight;
      const dist = endY - startY;
      const t0 = performance.now();
      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / DURATION);
        track.style.transform = `translate3d(0, ${startY + dist * easeInOutCubic(p)}px, 0)`;
        if (p < 1) {
          raf = requestAnimationFrame(frame);
        } else {
          window.setTimeout(() => {
            animating = false;
            // carry over scroll that arrived mid-glide instead of eating it
            if (Math.abs(accum) >= THRESHOLD) {
              const dir = accum > 0 ? 1 : -1;
              accum = 0;
              advance(dir);
            } else {
              accum = 0;
            }
          }, SETTLE);
        }
      };
      raf = requestAnimationFrame(frame);
    };

    const advance = (dir: number) => {
      if (animating) return;
      const next = index + dir;
      if (next < 0) {
        accum = 0;
        return; // already on the first photo
      }
      if (next >= count) {
        // release the album, hand off to real page scroll for the footer
        accum = 0;
        window.scrollTo({ top: FOOTER_KICK, behavior: "auto" });
        return;
      }
      animateTo(next);
    };

    const locked = () => document.body.style.overflow === "hidden";
    const atTop = () => window.scrollY <= EPSILON;

    const onWheel = (e: WheelEvent) => {
      if (locked() || !clipped || !atTop()) return;
      e.preventDefault();
      accum += e.deltaY;
      if (animating) return;
      if (Math.abs(accum) >= THRESHOLD) {
        const dir = accum > 0 ? 1 : -1;
        accum = 0;
        advance(dir);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (locked() || !clipped || !atTop() || animating) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        advance(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        advance(-1);
      }
    };

    const measure = () => {
      count = track.children.length;
    };

    const applyClipping = () => {
      viewport.style.height = "100svh";
      viewport.style.overflow = "hidden";
      clipped = true;
      measure();
      applyTransform(index);
    };
    const removeClipping = () => {
      viewport.style.height = "";
      viewport.style.overflow = "";
      track.style.transform = "";
      clipped = false;
    };

    const checkBreakpoint = () => {
      if (desktopMq.matches) applyClipping();
      else removeClipping();
    };

    const onResize = () => {
      if (!clipped) return;
      measure();
      applyTransform(index);
    };

    checkBreakpoint();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    desktopMq.addEventListener("change", checkBreakpoint);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      desktopMq.removeEventListener("change", checkBreakpoint);
    };
  }, []);

  return (
    <div ref={viewportRef} className={`relative ${className}`}>
      <div ref={trackRef} className="will-change-transform">
        {children}
      </div>
    </div>
  );
}
