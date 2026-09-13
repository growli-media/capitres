import type { Currency, Money } from "@/lib/catalog/types";

/**
 * Deterministic money formatting (no Intl) so server and client output are
 * byte-identical across runtimes — avoids hydration mismatches.
 *
 * Digits are always Western/Latin numerals, in every locale — an explicit
 * store decision, not an oversight: Eastern Arabic-Indic numerals used to
 * appear for ar/ku, but customers found a mismatched digit style
 * confusing next to a Latin-numeral keyboard/receipt, so every locale now
 * renders the same digits and only the currency label changes.
 *
 * en  -> "IQD 65,000"
 * ar  -> "65,000 د.ع"
 * ku  -> "65,000 د.ع"
 */

/** Reference market rates — used for the "≈" hint and as a fallback when a
 * product has no admin-set explicit price for that currency. Not used for
 * anything Wayl settles (that's always IQD, from Money.amount directly). */
export const IQD_PER_USD = 1310;
export const IQD_PER_EUR = 1430;

function group(n: number, separator: string): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function formatIQD(amount: number, locale: string): string {
  if (locale === "ar" || locale === "ku") {
    return `${group(amount, ",")} د.ع`;
  }
  return `IQD ${group(amount, ",")}`;
}

export function formatMoney(money: Money, locale: string): string {
  return formatIQD(money.amount, locale);
}

export function approxUsd(amount: number): string {
  return `$${group(Math.round(amount / IQD_PER_USD), ",")}`;
}

/** Digits are always Western now (see the file-level note above) — this
 * stays a no-op passthrough rather than being removed so existing call
 * sites that thread a locale through don't need to change. */
export function localizeDigits(value: string | number, locale: string): string {
  void locale;
  return String(value);
}

/** Converts a whole-IQD amount into the given currency's minor unit (cents
 * for USD/EUR, unchanged for IQD). Used only for computed fallbacks/hints —
 * never for anything actually charged. */
export function convertFromIqd(amountIqd: number, currency: Currency): number {
  if (currency === "IQD") return amountIqd;
  const rate = currency === "USD" ? IQD_PER_USD : IQD_PER_EUR;
  return Math.round((amountIqd / rate) * 100);
}

/** Formats a whole-IQD amount either as-is or converted to USD, for admin
 * views (revenue dashboard) that let staff switch the display currency.
 * Always the reference rate above — never anything actually charged. */
export function formatIqdAs(
  amountIqd: number,
  currency: "IQD" | "USD",
  locale: string,
): string {
  if (currency === "IQD") return formatIQD(amountIqd, locale);
  return formatCurrency(convertFromIqd(amountIqd, "USD"), "USD", locale);
}

/** amount is cents for USD/EUR, whole units for IQD. */
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string,
): string {
  if (currency === "IQD") return formatIQD(amount, locale);
  const symbol = currency === "USD" ? "$" : "€";
  const cents = Math.abs(Math.round(amount));
  const whole = Math.floor(cents / 100);
  const frac = (cents % 100).toString().padStart(2, "0");
  const sign = amount < 0 ? "-" : "";
  return `${sign}${symbol}${group(whole, ",")}.${frac}`;
}
