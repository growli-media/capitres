import type { Money } from "@/lib/catalog/types";

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

/** Reference market rate used only for the "≈ USD" hint on PDPs. */
export const IQD_PER_USD = 1310;

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
