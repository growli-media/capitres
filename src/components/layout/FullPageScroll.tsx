"use client";

import { useEffect } from "react";

/**
 * Desktop full-page controller for the homepage. Each section is a static
 * full-screen photo; the panels are CSS-sticky so the next one covers the
 * previous from the bottom. This locks scrolling to one photo at a time: a
 * single wheel/keyboard step animates (slowly, gently) to the next stop and
 * blocks input until it lands — no resting in the middle.
 *
 * Only runs on pointer-capable desktop widths and when motion is allowed;
 * touch/mobile and reduced-motion fall back to normal scrolling. It also
 * stands down whenever a scroll-locking overlay (cart, mobile menu) is open.
 */
export default function FullPageScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reduce || !desktop) return;

    const main = document.getElementById("main");
    if (!main) return;

    // Absolute document top of an element via the offsetParent chain — stable
    // under position:sticky (offsetTop reflects flow, not the sticky offset)
    // and correct even when the sections sit inside a wrapper div.
    const absTop = (el: HTMLElement) => {
      let y = 0;
      let node: HTMLElement | null = el;
      while (node) {
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return y;
    };

    let stops: number[] = [];
    const measure = () => {
      const secs = Array.from(main.querySelectorAll<HTMLElement>("section"));
      const footer = document.querySelector<HTMLElement>("footer");
      const els = footer ? [...secs, footer] : secs;
      stops = els.map(absTop).sort((a, b) => a - b);
    };
    measure();
    if (stops.length < 2) return;

    const nearest = (y: number) => {
      let bi = 0;
      let bd = Infinity;
      stops.forEach((s, i) => {
        const d = Math.abs(s - y);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      return bi;
    };

    let index = nearest(window.scrollY);
    let animating = false;
    let lastLanded = 0;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const go = (to: number) => {
      to = Math.max(0, Math.min(stops.length - 1, to));
      if (animating || to === index) return;
      index = to;
      animating = true;
      const startY = window.scrollY;
      const dist = stops[to] - startY;
      const duration = 1000; // gentle glide
      const t0 = performance.now();
      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        window.scrollTo(0, Math.round(startY + dist * easeInOutCubic(p)));
        if (p < 1) {
          requestAnimationFrame(frame);
        } else {
          animating = false;
          lastLanded = performance.now();
        }
      };
      requestAnimationFrame(frame);
    };

    const locked = () => document.body.style.overflow === "hidden";

    const onWheel = (e: WheelEvent) => {
      if (locked()) return;
      e.preventDefault();
      if (animating || performance.now() - lastLanded < 140) return;
      if (Math.abs(e.deltaY) < 4) return;
      go(index + (e.deltaY > 0 ? 1 : -1));
    };

    const onKey = (e: KeyboardEvent) => {
      if (locked()) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      }
    };

    const onResize = () => {
      measure();
      index = nearest(window.scrollY);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
