"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play } from "@phosphor-icons/react";
import type { Collection } from "@/lib/catalog/types";
import { pick } from "@/lib/content";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

const SLIDE_MS = 5000;

/**
 * The collection page's full-bleed hero background — three modes:
 *   1. A video (customer-controlled play/pause), when collection.videoUrl
 *      is set — takes priority over photo rotation.
 *   2. An auto-rotating photo carousel with a non-text segmented progress
 *      bar (Instagram-Stories-style), when collection.heroImages has more
 *      than one photo.
 *   3. A single static image otherwise (also the fallback for rows that
 *      predate this feature, via collection.heroImage).
 * Pauses rotation and any continuous motion under prefers-reduced-motion,
 * matching the convention already established in HeroMedia.tsx.
 */
export default function CollectionHero({
  collection,
  locale,
}: {
  collection: Collection;
  locale: string;
}) {
  const images =
    collection.heroImages && collection.heroImages.length > 0
      ? collection.heroImages
      : [collection.heroImage];
  const hasVideo = !!collection.videoUrl;
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const rotate = !hasVideo && images.length > 1 && !reducedMotion;

  useEffect(() => {
    if (!rotate || hovering) return;
    const id = setTimeout(() => {
      setActive((i) => (i + 1) % images.length);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [rotate, hovering, active, images.length]);

  function toggleVideo() {
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

  if (hasVideo) {
    return (
      <div className="absolute inset-0">
        <Image
          src={images[0].src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        {!reducedMotion && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover opacity-55"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            >
              <source src={collection.videoUrl} type="video/mp4" />
            </video>
            <button
              type="button"
              onClick={toggleVideo}
              aria-label={playing ? "Pause video" : "Play video"}
              className="absolute bottom-6 end-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-paper/40 text-paper/80 backdrop-blur-sm transition-colors hover:border-paper hover:text-paper"
            >
              {playing ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={images[active].src}
            alt={pick(images[active].alt, locale)}
            fill
            priority={active === 0}
            sizes="100vw"
            className="object-cover opacity-55"
          />
        </motion.div>
      </AnimatePresence>

      {rotate && (
        <div className="absolute inset-x-6 top-6 z-20 flex gap-1.5" aria-hidden="true">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              className="h-0.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-paper/25"
            >
              {i === active ? (
                <div
                  className="h-full bg-paper"
                  style={{
                    animation: `collection-hero-progress ${SLIDE_MS}ms linear forwards`,
                    animationPlayState: hovering ? "paused" : "running",
                  }}
                />
              ) : i < active ? (
                <div className="h-full w-full bg-paper" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
