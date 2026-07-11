import { localizeDigits } from "@/lib/money";

/**
 * Deterministic editorial date: 2026-06-12 -> "12.06.2026"
 * (Eastern digits for ar/ku). No Intl, so SSR output is stable.
 */
export function formatDateNumeric(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-");
  return localizeDigits(`${d}.${m}.${y}`, locale);
}
