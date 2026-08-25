import type { Currency, Money } from "@/lib/catalog/types";

/**
 * Deterministic money formatting (no Intl) so server and client output are
 * byte-identical across runtimes — avoids hydration mismatches.
 *
 * en  -> "IQD 65,000"
 * ar  -> "٦٥٬٠٠٠ د.ع"
 * ku  -> "٦٥٬٠٠٠ د.ع"
 */

const EASTERN_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const ARABIC_THOUSANDS = "٬";

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

function toEasternDigits(value: string): string {
  return value.replace(/\d/g, (d) => EASTERN_DIGITS[Number(d)]);
}

export function formatIQD(amount: number, locale: string): string {
  if (locale === "ar" || locale === "ku") {
    return `${toEasternDigits(group(amount, ARABIC_THOUSANDS))} د.ع`;
  }
  return `IQD ${group(amount, ",")}`;
}

export function formatMoney(money: Money, locale: string): string {
  return formatIQD(money.amount, locale);
}

export function approxUsd(amount: number): string {
  return `$${group(Math.round(amount / IQD_PER_USD), ",")}`;
}

export function localizeDigits(value: string | number, locale: string): string {
  const s = String(value);
  return locale === "ar" || locale === "ku" ? toEasternDigits(s) : s;
}

/** Converts a whole-IQD amount into the given currency's minor unit (cents
 * for USD/EUR, unchanged for IQD). Used only for computed fallbacks/hints —
 * never for anything actually charged. */
export function convertFromIqd(amountIqd: number, currency: Currency): number {
  if (currency === "IQD") return amountIqd;
  const rate = currency === "USD" ? IQD_PER_USD : IQD_PER_EUR;
  return Math.round((amountIqd / rate) * 100);
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
  const wholeStr = group(whole, locale === "ar" || locale === "ku" ? ARABIC_THOUSANDS : ",");
  const digits = `${wholeStr}.${frac}`;
  return `${sign}${symbol}${locale === "ar" || locale === "ku" ? toEasternDigits(digits) : digits}`;
}
