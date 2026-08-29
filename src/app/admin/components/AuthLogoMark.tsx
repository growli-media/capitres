"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * The CAPITRES wordmark shown on every pre-login auth screen, with an
 * "aurora glow" behind it — soft blurred blobs slowly drifting (paused
 * under prefers-reduced-motion via motion-safe:), intensifying on hover,
 * and a one-shot bounce on click. Shared by all 6 auth pages, which
 * previously duplicated this markup byte-for-byte with no interactivity.
 */
export default function AuthLogoMark() {
  const [pulsing, setPulsing] = useState(false);

  function handleClick() {
    setPulsing(true);
    window.setTimeout(() => setPulsing(false), 500);
  }

  return (
    <div className="group relative mx-auto flex h-24 w-full max-w-xs items-center justify-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="motion-safe:animate-aurora-a absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/40 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-blue-200/60" />
        <div className="motion-safe:animate-aurora-b absolute top-1/2 left-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/40 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-amber-100/60" />
        <div className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300/40 blur-2xl transition-all duration-500 group-hover:scale-125" />
      </div>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Capitres"
        className={`relative cursor-pointer transition-transform duration-300 ease-out hover:scale-105 ${pulsing ? "scale-110" : ""}`}
      >
        <Image src="/brand/logo-black.svg" alt="Capitres" width={867} height={99} priority className="h-6 w-auto" />
      </button>
    </div>
  );
}
