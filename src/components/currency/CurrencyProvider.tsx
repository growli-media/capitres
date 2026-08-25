"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Currency } from "@/lib/catalog/types";
import { CURRENCY_COOKIE, isValidCurrency } from "@/lib/currency/cookie";

const CurrencyContext = createContext<{
  currency: Currency;
  setCurrency: (next: Currency) => void;
} | null>(null);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(): Currency | undefined {
  const match = document.cookie.match(/(?:^|; )capitres_currency=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return isValidCurrency(value) ? value : undefined;
}

/**
 * Every product already carries all three currencies' prices to the
 * client (see Product.priceByCurrency), so switching currency is a pure
 * client-side re-render — no navigation, no server round trip.
 *
 * Deliberately does NOT read the cookie server-side: the locale layout is
 * statically generated (generateStaticParams), and `cookies()` anywhere in
 * that tree would force the whole site dynamic on every request — a much
 * bigger cost than the alternative here, a one-time correction right after
 * mount from IQD (the SSR/first-paint default) to whatever the geo-default
 * or a past manual choice actually was, via the effect below.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("IQD");

  useEffect(() => {
    const fromCookie = readCookie();
    if (fromCookie && fromCookie !== "IQD") setCurrencyState(fromCookie);
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
