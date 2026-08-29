"use client";

import { useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Pause, Play } from "@phosphor-icons/react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

/**
 * Full-screen hero media, Saint-Laurent style: a muted, looped, autoplaying
 * campaign film over a static poster, with a play/pause control in the
 * corner. When no film is supplied the poster carries a slow, subtle
 * cinematic drift instead — so the section always feels alive, and dropping
 * a real clip at /public/hero.mp4 (set videoSrc="/hero.mp4") is instant.
 */
export default function HeroMedia({
  poster,
  videoSrc,
  objectPosition = "50% 28%",
}: {
  poster: StaticImageData;
  videoSrc?: string;
  objectPosition?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const showVideo = !reducedMotion && !!videoSrc;

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="absolute inset-0">
      <Image
        src={poster}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={62}
        style={{ objectPosition }}
        className={`object-cover ${!showVideo && !reducedMotion ? "hero-kenburns" : ""}`}
      />
      {showVideo && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition }}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause video" : "Play video"}
            className="absolute bottom-6 end-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-paper/40 text-paper/80 backdrop-blur-sm transition-colors hover:border-paper hover:text-paper"
          >
            {playing ? (
              <Pause size={14} weight="fill" />
            ) : (
              <Play size={14} weight="fill" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
