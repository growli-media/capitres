"use client";

import { useEffect } from "react";

/**
 * Desktop full-page controller for the homepage. Each section is a static
 * full-screen photo; the panels are CSS-sticky so the next one covers the
 * previous from the bottom. Every wheel/keyboard step is handled instantly:
 * it re-aims at the next stop and animates there with a fast, snappy ease —
 * no cooldown and no input-blocking, so consecutive scrolls chain smoothly
 * and it never feels late. Scrolling stays locked to one photo per step.
 *
 * Desktop + motion only; touch/mobile and reduced-motion free-scroll. Stands
 * down whenever a scroll-locking overlay (cart, mobile menu) is open.
 */
export default function FullPageScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reduce || !desktop) return;

    const main = document.getElementById("main");
    if (!main) return;

    // Absolute document top via the offsetParent chain — stable under
    // position:sticky and correct even inside a wrapper div.
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

    let target = nearest(window.scrollY);
    let raf: number | null = null;
    let startY = 0;
    let startTime = 0;
    const DURATION = 430; // fast, snappy cover
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / DURATION);
      const targetY = stops[target];
      window.scrollTo(0, Math.round(startY + (targetY - startY) * ease(p)));
      raf = p < 1 ? requestAnimationFrame(tick) : null;
    };

    const step = (dir: number) => {
      const nt = Math.max(0, Math.min(stops.length - 1, target + dir));
      if (nt === target) return;
      target = nt;
      startY = window.scrollY; // re-aim from wherever we are right now
      startTime = performance.now();
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    const locked = () => document.body.style.overflow === "hidden";

    // Sensitivity control: require a deliberate scroll (accumulate to
    // THRESHOLD) before advancing, and pace advances to at most one per GAP —
    // so it steps one photo at a time instead of firing on every wheel tick.
    const THRESHOLD = 40;
    const GAP = 420;
    let accum = 0;
    let lastStep = -Infinity;

    const tryStep = (dir: number, now: number) => {
      if (now - lastStep < GAP) return;
      lastStep = now;
      accum = 0;
      step(dir);
    };

    const onWheel = (e: WheelEvent) => {
      if (locked()) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastStep < GAP) {
        accum = 0; // still settling on the current photo — ignore
        return;
      }
      accum += e.deltaY;
      if (Math.abs(accum) >= THRESHOLD) tryStep(accum > 0 ? 1 : -1, now);
    };

    const onKey = (e: KeyboardEvent) => {
      if (locked()) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      const now = performance.now();
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        tryStep(1, now);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        tryStep(-1, now);
      }
    };

    const onResize = () => {
      measure();
      target = nearest(window.scrollY);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
