"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Minimal, monochrome cookie notice. Purely informational — it does not
 * gate the analytics scripts (those stay functionally unchanged), it just
 * discloses their use and lets the visitor dismiss the bar once.
 *
 * Copy is carried locally in all three site languages rather than in the
 * shared next-intl message files, so the translation catalogue is left
 * untouched while the bar still speaks the active locale.
 */

const KEY = "capitres-cookie-notice";

const listeners = new Set<() => void>();
function emitDismissed() {
  listeners.forEach((l) => l());
}

function useDismissed(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      try {
        return window.localStorage.getItem(KEY) === "1";
      } catch {
        return true;
      }
    },
    () => true, // server: render nothing until the client confirms state
  );
}

type Copy = { text: string; accept: string; more: string };

const COPY: Record<string, Copy> = {
  en: {
    text: "We use cookies to power the shop and understand how it is used.",
    accept: "Accept",
    more: "Privacy Policy",
  },
  ar: {
    text: "نستخدم ملفات تعريف الارتباط لتشغيل المتجر وفهم كيفية استخدامه.",
    accept: "موافق",
    more: "سياسة الخصوصية",
  },
  ku: {
    text: "ئێمە کووکی بەکاردەهێنین بۆ کارپێکردنی فرۆشگاکە و تێگەیشتن لە بەکارهێنانی.",
    accept: "ڕازیم",
    more: "سیاسەتی تایبەتمەندی",
  },
};

export default function CookieNotice() {
  const locale = useLocale();
  const dismissed = useDismissed();
  const copy = COPY[locale] ?? COPY.en;

  if (dismissed) return null;

  function accept() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* storage blocked — dismiss for this session only */
    }
    emitDismissed();
  }

  return (
    <div
      role="region"
      aria-label={copy.more}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-paper/15 bg-ink text-paper"
    >
      <div className="container-x flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <p className="max-w-2xl text-sm text-paper/80">
          {copy.text}{" "}
          <Link
            href="/privacy"
            className="link-underline font-semibold text-paper"
          >
            {copy.more}
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="btn btn-paper shrink-0 self-start sm:self-auto"
        >
          {copy.accept}
        </button>
      </div>
    </div>
  );
}
