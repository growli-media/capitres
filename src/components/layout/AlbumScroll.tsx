"use client";

import { useEffect, useRef, type ReactNode } from "react";

const DURATION_MS = 550;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const THRESHOLD = 30; // accumulated wheel delta needed to trigger an advance
const FOOTER_KICK = 40; // px — real scroll nudge that hands off to the footer
const EPSILON = 4; // px — "are we still at the top of the album" tolerance

/**
 * Homepage "photo album": each full-screen photo sits absolutely positioned
 * in a 100svh-clipped viewport, at rest either fully visible (translateY 0%)
 * or parked just below (translateY 100%). Advancing forward animates ONLY the
 * incoming photo from 100%->0% — it slides up and lands completely on top of
 * whichever photo is resting beneath it (later DOM order paints over earlier,
 * so the photos already at 0% stay put, simply occluded). Advancing backward
 * animates the current photo back down (0%->100%), revealing the one beneath,
 * which never moved. Animation is a native CSS transition on `transform`
 * (compositor-only), not a JS scroll/loop, so it's as smooth as the browser
 * can make it.
 *
 * The document's real scroll position never moves while inside the album
 * (wheel is captured while scrollY ~= 0); advancing past the last photo hands
 * off to normal page scroll to reveal the footer, and scrolling back up from
 * the footer re-enters the album on its last photo.
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

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const desktopMq = window.matchMedia("(min-width: 1024px)");
    let clipped = false;
    let panels: HTMLElement[] = [];
    let index = 0;
    let animating = false;
    let accum = 0;
    let settleTimer = 0;
    let safetyTimer = 0;

    const setResting = (el: HTMLElement, visible: boolean) => {
      // Zero only the duration (not the whole `transition` shorthand — that
      // would reset transitionProperty/timingFunction set in layout() too)
      // so the instant snap doesn't clobber the real animation duration.
      const restoreDuration = el.style.transitionDuration;
      el.style.transitionDuration = "0s";
      el.style.transform = visible ? "translateY(0%)" : "translateY(100%)";
      void el.offsetHeight; // force reflow so the instant snap actually applies
      el.style.transitionDuration = restoreDuration;
    };

    const layout = () => {
      panels = Array.from(viewport.children) as HTMLElement[];
      panels.forEach((el, i) => {
        el.style.position = "absolute";
        el.style.inset = "0";
        el.style.transitionProperty = "transform";
        el.style.transitionDuration = `${DURATION_MS}ms`;
        el.style.transitionTimingFunction = EASE;
        el.style.willChange = "transform";
        setResting(el, i <= index);
      });
    };

    const settle = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        animating = false;
        if (Math.abs(accum) >= THRESHOLD) {
          const dir = accum > 0 ? 1 : -1;
          accum = 0;
          advance(dir);
        } else {
          accum = 0;
        }
      }, 40);
    };

    const advance = (dir: number) => {
      if (animating) return;
      const next = index + dir;
      if (next < 0) {
        accum = 0;
        return; // already on the first photo
      }
      if (next >= panels.length) {
        accum = 0;
        window.scrollTo({ top: FOOTER_KICK, behavior: "auto" }); // hand off to the footer
        return;
      }
      animating = true;
      const el = dir > 0 ? panels[next] : panels[index];
      index = next;
      el.style.transform = dir > 0 ? "translateY(0%)" : "translateY(100%)";
      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== "transform") return;
        el.removeEventListener("transitionend", onEnd);
        settle();
      };
      el.addEventListener("transitionend", onEnd);
      window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => {
        el.removeEventListener("transitionend", onEnd);
        if (animating) settle();
      }, DURATION_MS + 150);
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

    const applyClipping = () => {
      viewport.style.height = "100svh";
      viewport.style.overflow = "hidden";
      clipped = true;
      layout();
    };
    const removeClipping = () => {
      viewport.style.height = "";
      viewport.style.overflow = "";
      clipped = false;
      panels.forEach((el) => {
        el.style.position = "";
        el.style.inset = "";
        el.style.transform = "";
        el.style.transition = "";
        el.style.willChange = "";
      });
    };

    const checkBreakpoint = () => {
      if (desktopMq.matches) applyClipping();
      else removeClipping();
    };

    const onResize = () => {
      if (clipped) layout();
    };

    checkBreakpoint();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    desktopMq.addEventListener("change", checkBreakpoint);

    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(safetyTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      desktopMq.removeEventListener("change", checkBreakpoint);
    };
  }, []);

  return (
    <div ref={viewportRef} className={`relative ${className}`}>
      {children}
    </div>
  );
}
