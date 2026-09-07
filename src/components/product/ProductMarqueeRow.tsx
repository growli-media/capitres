"use client";

import { useEffect, useRef, type ReactNode } from "react";

const SPEED_PX_PER_S = 26; // slow, ambient drift

/**
 * One self-scrolling row of products. Always drifts via rAF — there is no
 * pause condition at all: no drag-to-scroll (deliberately dropped; a
 * click-and-drag control here was the very thing that kept swallowing
 * clicks — see below), wheel is blocked outright, and touch panning is
 * restricted to the vertical axis. Nothing can interrupt or fight the
 * autoplay tick, so it never visibly stalls no matter what the visitor
 * does with the mouse. The only interaction left is clicking a product,
 * which now works natively — nothing here calls setPointerCapture or
 * intercepts the click event, which is what caused clicks to silently
 * miss their target before.
 *
 * The strip is force-`dir="ltr"`: it's decorative and looped, so it
 * doesn't need to mirror for RTL pages the way real reading content
 * does, and pinning the direction keeps scrollLeft math identical on
 * every locale instead of chasing RTL's inverted-sign scrollLeft
 * behaviour.
 *
 * Purely presentational: the caller (a Server Component, since ProductCard
 * reads the catalog) renders the actual cards and hands them in as
 * `primary`/`clone` — an identical second copy so the loop can wrap
 * seamlessly. This file only ever touches layout/scroll, never product
 * data, so it stays import-safe as a Client Component.
 */
export default function ProductMarqueeRow({
  direction,
  primary,
  clone,
}: {
  /** Which way the strip drifts. */
  direction: "left" | "right";
  primary: ReactNode;
  clone: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Autoplay loop — unconditional, every frame, forever.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const sign = direction === "left" ? 1 : -1;
    if (sign < 0) {
      // Start mid-strip so it has room to count down before wrapping.
      el.scrollLeft = el.scrollWidth / 2;
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const half = el.scrollWidth / 2;
      let next = el.scrollLeft + sign * SPEED_PX_PER_S * dt;
      if (half > 0) {
        if (next >= half) next -= half;
        else if (next < 0) next += half;
      }
      el.scrollLeft = next;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [direction]);

  // Wheel is a no-op here rather than left alone — letting the browser
  // natively wheel-scroll the strip would still fight the autoplay loop's
  // own scrollLeft writes every frame, which looks the same as a stall.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={scrollerRef}
      dir="ltr"
      style={{ touchAction: "pan-y" }}
      className="no-scrollbar flex gap-4 overflow-x-auto overscroll-x-contain md:gap-6"
    >
      <div className="flex shrink-0 gap-4 md:gap-6">{primary}</div>
      <div className="flex shrink-0 gap-4 md:gap-6" aria-hidden inert>
        {clone}
      </div>
    </div>
  );
}
