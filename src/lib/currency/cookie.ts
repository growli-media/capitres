import type { Currency } from "@/lib/catalog/types";

/** Non-httpOnly (the currency switcher reads/writes it client-side directly)
 * so no server round trip is needed just to change the display currency. */
export const CURRENCY_COOKIE = "capitres_currency";

const VALID: readonly Currency[] = ["IQD", "USD", "EUR"];

export function isValidCurrency(value: string | undefined | null): value is Currency {
  return !!value && (VALID as readonly string[]).includes(value);
}
