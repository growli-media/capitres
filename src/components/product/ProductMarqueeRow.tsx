"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

const SPEED_PX_PER_S = 26; // slow, ambient drift
const RESUME_DELAY_MS = 1500; // idle time before autoplay picks back up

/**
 * One self-scrolling row of products. Drifts on its own via rAF and never
 * stops for hovering, mouse movement, or an incidental wheel tick — only a
 * real click-and-drag takes over, using the browser's native scroll, with
 * autoplay resuming a beat after the user lets go (see the scroll-event
 * debounce below). The strip is force-`dir="ltr"`: it's decorative and
 * looped, so it doesn't need to mirror for RTL pages the way real reading content does,
 * and pinning the direction keeps scrollLeft math identical on every locale
 * instead of chasing RTL's inverted-sign scrollLeft behaviour.
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
  /** Which way the strip drifts while idle. */
  direction: "left" | "right";
  primary: ReactNode;
  clone: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }, []);

  // Autoplay loop.
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
      if (!pausedRef.current) {
        const half = el.scrollWidth / 2;
        let next = el.scrollLeft + sign * SPEED_PX_PER_S * dt;
        if (half > 0) {
          if (next >= half) next -= half;
          else if (next < 0) next += half;
        }
        el.scrollLeft = next;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [direction]);

  // Only an actual drag (below) ever pauses this — hovering, moving the
  // mouse, or a stray wheel tick passing over the strip must never stop
  // it. Wheel is blocked outright (preventDefault, non-passive) rather
  // than just left unpaused: letting the browser natively wheel-scroll
  // this element would still fight the autoplay loop's own scrollLeft
  // writes every frame — same visible stall, just from a second writer
  // instead of a pause flag. The resume countdown here is purely for the
  // drag path below — its own scrollLeft writes fire native "scroll"
  // events, which keep pushing the countdown out so autoplay doesn't
  // creep back in mid-drag.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", scheduleResume, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", scheduleResume);
    };
  }, [scheduleResume]);

  // Click-and-drag for mouse/pen users (touch already scrolls natively).
  // Pointer capture is only claimed once the pointer actually crosses the
  // drag threshold below — claiming it eagerly on every pointerdown made
  // Chrome retarget the resulting click event to this div instead of the
  // product <Link> underneath the cursor, silently swallowing every plain
  // click (drag or not) before it could navigate anywhere.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = scrollerRef.current;
    if (!el) return;
    draggingRef.current = true;
    draggedRef.current = false;
    dragStart.current = { x: e.clientX, scrollLeft: el.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 4 && !draggedRef.current) {
      draggedRef.current = true;
      el.setPointerCapture(e.pointerId);
      pause();
    }
    if (draggedRef.current) el.scrollLeft = dragStart.current.scrollLeft - dx;
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const el = scrollerRef.current;
    if (el?.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  };

  return (
    <div
      ref={scrollerRef}
      dir="ltr"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      className="no-scrollbar flex cursor-grab gap-4 overflow-x-auto overscroll-x-contain active:cursor-grabbing md:gap-6"
    >
      <div className="flex shrink-0 gap-4 md:gap-6">{primary}</div>
      <div className="flex shrink-0 gap-4 md:gap-6" aria-hidden inert>
        {clone}
      </div>
    </div>
  );
}
