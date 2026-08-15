"use client";

import { useState, type ReactNode } from "react";
import { useLocale } from "next-intl";

/**
 * Client wrapper around the PLP grid that adds an editorial density toggle
 * (comfortable ↔ compact). The server renders the product cards and passes
 * them through as children, so switching density is instant and never
 * refetches. Labels are carried locally per-locale so the shared next-intl
 * catalogue is left untouched.
 */

type Labels = { group: string; comfortable: string; compact: string };

const LABELS: Record<string, Labels> = {
  en: { group: "Grid density", comfortable: "Comfortable view", compact: "Compact view" },
  ar: { group: "كثافة الشبكة", comfortable: "عرض مريح", compact: "عرض مكثّف" },
  ku: { group: "چڕی تۆڕ", comfortable: "پیشاندانی ئاسوودە", compact: "پیشاندانی چڕ" },
};

function Bars({ count }: { count: number }) {
  const gap = 3;
  const total = 18;
  const w = (total - gap * (count - 1)) / count;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      aria-hidden="true"
      fill="currentColor"
    >
      {Array.from({ length: count }).map((_, i) => (
        <rect key={i} x={i * (w + gap)} y="0" width={w} height="18" rx="0.5" />
      ))}
    </svg>
  );
}

export default function ProductGrid({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const l = LABELS[locale] ?? LABELS.en;
  const [compact, setCompact] = useState(false);

  const grid = compact
    ? "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    : "grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4";

  const btn = (active: boolean) =>
    `flex h-9 w-9 items-center justify-center border transition-colors ${
      active
        ? "border-ink bg-ink text-paper"
        : "border-line text-ink/50 hover:text-ink"
    }`;

  return (
    <>
      <div
        role="group"
        aria-label={l.group}
        className="mb-6 flex items-center justify-end gap-2"
      >
        <button
          type="button"
          onClick={() => setCompact(false)}
          aria-pressed={!compact}
          aria-label={l.comfortable}
          className={btn(!compact)}
        >
          <Bars count={2} />
        </button>
        <button
          type="button"
          onClick={() => setCompact(true)}
          aria-pressed={compact}
          aria-label={l.compact}
          className={btn(compact)}
        >
          <Bars count={3} />
        </button>
      </div>
      <ul className={grid}>{children}</ul>
    </>
  );
}
