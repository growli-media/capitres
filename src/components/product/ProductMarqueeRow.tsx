"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const SPEED_PX_PER_S = 26; // slow, ambient drift — same pace as before

/**
 * One self-scrolling row of products. Driven entirely by a compositor CSS
 * animation (`transform: translateX`) instead of JS writing `scrollLeft`
 * every frame — there is no scroll container here at all, which is the
 * point: a native `overflow-x-auto` strip is still subject to the
 * platform's own scroll machinery (touch/wheel momentum, scroll
 * anchoring compensating for image-driven layout shifts, an ancestor's
 * CSS transition suspending the browser's scroll-position updates while
 * it runs) fighting a JS-driven scrollLeft write, which is what could
 * make one row visibly stall on some devices while a sibling row kept
 * moving. A transform-driven track has none of that to fight — the
 * browser just plays the animation, unconditionally, the same way a CSS
 * animation anywhere else on the page runs. Wheel/touch have nothing to
 * grab (this isn't a scroll container), so there's no pause condition to
 * write in the first place. Clicking a product still works natively —
 * nothing here intercepts pointer events.
 *
 * The track holds two identical copies of the row (`primary` + `clone`)
 * so a translateX(0 -> -50%) loop is seamless; animation-duration is set
 * inline from the track's own measured width so every row drifts at the
 * same constant px/s pace regardless of how many products are in it (a fixed
 * animation-duration would make a longer row visibly faster/choppier
 * than a shorter one covering the same duration).
 *
 * Both copies are real, clickable links — `clone` is NOT inert. A
 * "right"-drifting row plays its animation in reverse, which starts (and
 * spends most of the loop showing) the *second* half of the track, not
 * the first — so for that row `clone` is usually what's actually in the
 * viewport. Marking it inert/aria-hidden (as if it were purely
 * decorative filler) made exactly that row's products unclickable.
 *
 * Force-`dir="ltr"`: decorative and looped, so it doesn't need to mirror
 * for RTL pages — direction is purely the `direction` prop (which row
 * drifts which way), independent of the page's own text direction.
 *
 * Purely presentational: the caller (a Server Component, since ProductCard
 * reads the catalog) renders the actual cards and hands them in as
 * `primary`/`clone`. This file only ever touches layout/animation, never
 * product data, so it stays import-safe as a Client Component.
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [durationS, setDurationS] = useState<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const half = track.scrollWidth / 2;
      if (half > 0) setDurationS(half / SPEED_PX_PER_S);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  const animateClass =
    direction === "left" ? "motion-safe:animate-marquee" : "motion-safe:animate-marquee-reverse";

  return (
    <div className="overflow-hidden">
      <div
        ref={trackRef}
        dir="ltr"
        className={`flex w-max gap-4 md:gap-6 ${durationS !== null ? animateClass : ""}`}
        style={durationS !== null ? { animationDuration: `${durationS}s` } : undefined}
      >
        <div className="flex shrink-0 gap-4 md:gap-6">{primary}</div>
        <div className="flex shrink-0 gap-4 md:gap-6">{clone}</div>
      </div>
    </div>
  );
}
