"use client";

import { useEffect } from "react";

/**
 * Homepage "photo album" scroll. One scroll advances exactly one full-screen
 * section, animating all the way to it (a complete, smooth glide) and covering
 * the previous from the bottom — the sections are CSS-sticky. It owns the wheel
 * (no free scrolling / no partial reveal) and locks during each glide, so every
 * picture comes fully up before the next. Desktop + motion only; touch/mobile
 * and reduced-motion fall back to normal scrolling; stands down when a
 * scroll-locking overlay (cart, mobile menu) is open.
 */
export default function FullPageScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reduce || !desktop) return;

    const main = document.getElementById("main");
    if (!main) return;

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
      stops = (footer ? [...secs, footer] : secs)
        .map(absTop)
        .sort((a, b) => a - b);
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
    const DURATION = 750; // complete, smooth glide
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const go = (dir: number) => {
      const to = Math.max(0, Math.min(stops.length - 1, index + dir));
      if (animating || to === index) return;
      index = to;
      animating = true;
      const startY = window.scrollY;
      const dist = stops[to] - startY;
      const t0 = performance.now();
      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / DURATION);
        window.scrollTo(0, Math.round(startY + dist * easeInOutCubic(p)));
        if (p < 1) {
          requestAnimationFrame(frame);
        } else {
          // brief settle so the wheel's momentum tail can't double-advance
          window.setTimeout(() => {
            animating = false;
          }, 60);
        }
      };
      requestAnimationFrame(frame);
    };

    const locked = () => document.body.style.overflow === "hidden";
    let accum = 0;
    const THRESHOLD = 14; // reacts as soon as you scroll, ignores jitter

    const onWheel = (e: WheelEvent) => {
      if (locked()) return;
      e.preventDefault();
      if (animating) {
        accum = 0;
        return;
      }
      accum += e.deltaY;
      if (Math.abs(accum) >= THRESHOLD) {
        const dir = accum > 0 ? 1 : -1;
        accum = 0;
        go(dir);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (locked() || animating) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
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
