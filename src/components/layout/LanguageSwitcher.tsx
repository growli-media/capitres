"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CaretDown, CaretRight, Globe } from "@phosphor-icons/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeNames, type AppLocale } from "@/i18n/routing";

/**
 * Locale menu — swaps the locale segment while preserving the current
 * route and query string (filters, order refs, etc.).
 *
 * Two layouts:
 * - "dropdown" (default, desktop header): a panel drops below the trigger.
 * - "inline" (mobile overlay menu): the trigger's arrow points sideways,
 *   into the empty space beside it; clicking reveals the other languages
 *   in that same space, on the same row, and the arrow flips to point back
 *   — nothing opens on top of anything else, which is what makes it work
 *   in the mobile menu's narrow vertical rhythm.
 */
export default function LanguageSwitcher({
  tone = "ink",
  layout = "dropdown",
}: {
  tone?: "ink" | "paper";
  layout?: "dropdown" | "inline";
}) {
  const locale = useLocale();
  const t = useTranslations("a11y");
  const tLang = useTranslations("lang");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(next: AppLocale) {
    setOpen(false);
    if (next === locale) return;
    // Read the query string at interaction time — keeps filters and
    // order refs across the locale switch without a Suspense boundary.
    const href = `${pathname}${window.location.search}`;
    startTransition(() => {
      router.replace(href, { locale: next });
    });
  }

  const toneClasses =
    tone === "paper"
      ? "text-paper hover:text-white"
      : "text-ink hover:text-ash";

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-label={`${t("selectLanguage")}: ${locale.toUpperCase()}`}
      className={`flex min-h-11 cursor-pointer items-center gap-1.5 px-2 text-sm font-semibold transition-colors ${toneClasses}`}
    >
      <Globe size={18} aria-hidden="true" />
      <span className="uppercase">{locale}</span>
      {layout === "inline" ? (
        <CaretRight
          size={12}
          aria-hidden="true"
          className={`transition-transform duration-200 rtl:-scale-x-100 ${open ? "rotate-180" : ""}`}
        />
      ) : (
        <CaretDown
          size={12}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );

  if (layout === "inline") {
    const others = routing.locales.filter((l) => l !== locale);
    return (
      <div ref={rootRef} className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {trigger}
        {open && (
          <ul
            aria-label={tLang("label")}
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {others.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => switchTo(l)}
                  lang={l}
                  dir={l === "en" ? "ltr" : "rtl"}
                  className={`flex min-h-11 cursor-pointer items-center text-sm font-semibold transition-colors ${toneClasses}`}
                >
                  {localeNames[l]}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      {trigger}

      {open && (
        <ul
          aria-label={tLang("label")}
          className="absolute end-0 top-full z-50 mt-2 w-44 border border-line bg-paper py-1 shadow-xl"
        >
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                aria-current={l === locale ? "true" : undefined}
                onClick={() => switchTo(l)}
                lang={l}
                dir={l === "en" ? "ltr" : "rtl"}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between px-4 text-sm transition-colors hover:bg-studio ${
                  l === locale ? "font-bold text-ink" : "text-ink"
                }`}
              >
                <span>{localeNames[l]}</span>
                {l === locale && <span aria-hidden="true">•</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
