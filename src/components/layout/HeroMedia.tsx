"use client";

import { useSyncExternalStore } from "react";
import Image, { type StaticImageData } from "next/image";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Subscribes to prefers-reduced-motion. On the server it reports
 * "reduced" so the video never lands in the SSR HTML — the poster carries
 * LCP, and the video mounts client-side only when motion is allowed. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}

/**
 * Full-bleed hero media, YSL-style: a muted, looped, autoplaying campaign
 * video over a static poster image, all rendered near-monochrome. The
 * video mounts only when motion is allowed, so reduced-motion viewers get
 * the still poster and no autoplay.
 *
 * PLACEHOLDER: `videoSrc` currently points at a generic grayscale stock
 * clip just to show the motion. Drop your own campaign film at
 * /public/hero.mp4 and set videoSrc="/hero.mp4" to make it yours.
 */
export default function HeroMedia({
  poster,
  videoSrc,
}: {
  poster: StaticImageData;
  videoSrc?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="absolute inset-0">
      <Image
        src={poster}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={60}
        className="object-cover object-[50%_28%]"
      />
      {!reducedMotion && videoSrc && (
        <video
          className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
