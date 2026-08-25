"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDown, CaretRight, CurrencyCircleDollar } from "@phosphor-icons/react";
import type { Currency } from "@/lib/catalog/types";
import { useCurrency } from "./CurrencyProvider";

const CURRENCIES: Currency[] = ["IQD", "USD", "EUR"];

/**
 * Currency menu — modeled directly on LanguageSwitcher (same tone/layout
 * split, same trigger + panel structure). Unlike the locale switcher,
 * switching here never navigates: every product already carries all three
 * currencies' prices to the client, so this is a pure client-side
 * re-render via CurrencyProvider.
 */
export default function CurrencySwitcher({
  tone = "ink",
  layout = "dropdown",
}: {
  tone?: "ink" | "paper";
  layout?: "dropdown" | "inline";
}) {
  const { currency, setCurrency } = useCurrency();
  const t = useTranslations("a11y");
  const [open, setOpen] = useState(false);
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

  function switchTo(next: Currency) {
    setOpen(false);
    setCurrency(next);
  }

  const toneClasses =
    tone === "paper" ? "text-paper hover:text-white" : "text-ink hover:text-ash";

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-label={`${t("selectCurrency")}: ${currency}`}
      className={`flex min-h-11 cursor-pointer items-center gap-1.5 px-2 text-sm font-semibold transition-colors ${toneClasses}`}
    >
      <CurrencyCircleDollar size={18} aria-hidden="true" />
      <span className="uppercase">{currency}</span>
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
    const others = CURRENCIES.filter((c) => c !== currency);
    return (
      <div ref={rootRef} className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {trigger}
        {open && (
          <ul
            aria-label={t("selectCurrency")}
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {others.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => switchTo(c)}
                  className={`flex min-h-11 cursor-pointer items-center text-sm font-semibold transition-colors ${toneClasses}`}
                >
                  {c}
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
          aria-label={t("selectCurrency")}
          className="absolute end-0 top-full z-50 mt-2 w-28 border border-line bg-paper py-1 shadow-xl"
        >
          {CURRENCIES.map((c) => (
            <li key={c}>
              <button
                type="button"
                aria-current={c === currency ? "true" : undefined}
                onClick={() => switchTo(c)}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between px-4 text-sm transition-colors hover:bg-studio ${
                  c === currency ? "font-bold text-ink" : "text-ink"
                }`}
              >
                <span>{c}</span>
                {c === currency && <span aria-hidden="true">•</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
