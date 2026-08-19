"use client";

import { useEffect, useRef, type ReactNode } from "react";

const DURATION_MS = 550;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const WHEEL_THRESHOLD = 42; // accumulated wheel delta needed to trigger an advance
const TOUCH_THRESHOLD = 60; // px of drag needed to trigger an advance

/**
 * Homepage "photo album": each full-screen section — the hero, every panel,
 * and finally the footer — sits at rest either fully visible (translateY 0%)
 * or parked one viewport-height below (translateY 100%). Advancing forward
 * animates ONLY the incoming section from 100%->0% — it slides up and lands
 * completely on top of whichever one is resting beneath it (later DOM order
 * paints over earlier, so sections already at rest just get occluded, never
 * moving again). Advancing backward animates the current section back down,
 * revealing the one beneath, unchanged. The footer is the last stop in this
 * same stack — not a hand-off to real scrolling, it slides up and locks
 * exactly like a photo. Animation is a native CSS transition on `transform`
 * (compositor-only), not a JS scroll/loop.
 *
 * The footer is rendered by the shared layout, outside this component's own
 * DOM subtree, so it's grabbed via a query and given `position: fixed`
 * (matching the clipped viewport's on-screen position at scrollY 0) instead
 * of `position: absolute`. Because the footer's DOM node persists across
 * client-side navigation (the layout doesn't remount it), every style this
 * effect applies to it is explicitly reverted on cleanup.
 *
 * Works identically on touch: a swipe advances or retreats exactly one
 * section, same threshold-and-lock behaviour as the wheel/keyboard path.
 * Only reduced-motion opts out entirely, falling back to plain, normal,
 * unclipped scrolling.
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
    const footer = document.querySelector<HTMLElement>("footer");

    let panels: HTMLElement[] = [];
    let index = 0;
    let animating = false;
    let wheelAccum = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;
    let settleTimer = 0;
    let safetyTimer = 0;

    const setResting = (el: HTMLElement, visible: boolean) => {
      // Zero only the duration (not the whole `transition` shorthand — that
      // would reset transitionProperty/timingFunction too) so the instant
      // snap doesn't clobber the real animation duration.
      const restoreDuration = el.style.transitionDuration;
      el.style.transitionDuration = "0s";
      el.style.transform = visible ? "translateY(0%)" : "translateY(100%)";
      void el.offsetHeight; // force reflow so the instant snap actually applies
      el.style.transitionDuration = restoreDuration;
    };

    const layout = () => {
      const inFlow = Array.from(viewport.children) as HTMLElement[];
      panels = footer ? [...inFlow, footer] : inFlow;
      panels.forEach((el, i) => {
        const isFooter = el === footer;
        el.style.position = isFooter ? "fixed" : "absolute";
        el.style.inset = "0";
        el.style.zIndex = isFooter ? "20" : "";
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
        wheelAccum = 0; // don't auto-chain onto a fast/long scroll — one gesture, one section
      }, 40);
    };

    const advance = (dir: number) => {
      if (animating) return;
      const next = index + dir;
      if (next < 0 || next >= panels.length) return; // already at an end
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

    const locked = () => document.body.style.overflow === "hidden"; // cart/menu open

    const onWheel = (e: WheelEvent) => {
      if (locked()) return;
      e.preventDefault();
      if (animating) return; // ignore the tail of a fast scroll — no chaining
      wheelAccum += e.deltaY;
      if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
        const dir = wheelAccum > 0 ? 1 : -1;
        wheelAccum = 0;
        advance(dir);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (locked() || animating) return;
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

    const onTouchStart = (e: TouchEvent) => {
      if (locked() || e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchActive = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchActive || locked() || animating) return;
      const t = e.touches[0];
      const dy = touchStartY - t.clientY; // positive = swiped up = advance
      const dx = touchStartX - t.clientX;
      if (Math.abs(dy) <= Math.abs(dx)) return; // mostly horizontal — leave it alone
      e.preventDefault();
      if (Math.abs(dy) >= TOUCH_THRESHOLD) {
        touchActive = false; // one gesture, one section — ignore the rest of this drag
        advance(dy > 0 ? 1 : -1);
      }
    };

    const onTouchEnd = () => {
      touchActive = false;
    };

    const applyClipping = () => {
      viewport.style.height = "100svh";
      viewport.style.overflow = "hidden";
      viewport.style.touchAction = "none";
      layout();
    };

    const onResize = () => layout();

    applyClipping();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(safetyTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      // The footer's DOM node persists across client-side navigation (the
      // shared layout doesn't remount it) — every style applied above must
      // be explicitly reverted here, or it stays position:fixed forever.
      panels.forEach((el) => {
        el.style.position = "";
        el.style.inset = "";
        el.style.zIndex = "";
        el.style.transform = "";
        el.style.transition = "";
        el.style.willChange = "";
      });
      viewport.style.height = "";
      viewport.style.overflow = "";
      viewport.style.touchAction = "";
    };
  }, []);

  return (
    <div ref={viewportRef} className={`relative ${className}`}>
      {children}
    </div>
  );
}
