"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/**
 * A real shape morph, not a Sun/Moon icon swap — one disc, 8 rays, and an
 * SVG <mask> circle that slides over the disc to cut a crescent out of it.
 * In dark mode the cutout sits near the disc (crescent moon, rays hidden);
 * in light mode it slides fully outside the viewBox (full disc revealed,
 * rays fade/grow in) — a true sun. Using a <mask> (transparency) rather
 * than a solid-fill circle means this works over ANY background —
 * including the translucent, blurred glass button it sits on — without
 * needing to color-match a paint-over circle to that background.
 */
export default function ThemeToggleIcon({ dark }: { dark: boolean }) {
  const maskId = useId();
  const spring = { type: "spring" as const, stiffness: 240, damping: 22 };

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle
            r="6.5"
            fill="black"
            animate={{ cx: dark ? 9.5 : 27, cy: dark ? 8.5 : 27 }}
            transition={spring}
          />
        </mask>
      </defs>

      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 45} 12 12)`}>
          <motion.line
            x1="12"
            x2="12"
            y1="3"
            animate={{ opacity: dark ? 0 : 1, y2: dark ? 4.5 : 6 }}
            transition={spring}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      ))}

      <circle cx="12" cy="12" r="6" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
