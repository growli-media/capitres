/** Size-chart unit conversion — every measurement is stored canonically in
 * centimeters (see products.size_chart in schema.sql); these are the only
 * two functions that ever convert away from that, used purely for display
 * and admin data entry. Mirrors convertFromIqd()'s plain-function shape
 * in src/lib/money.ts. */

const CM_PER_IN = 2.54;

export function cmToIn(cm: number): number {
  return Math.round((cm / CM_PER_IN) * 10) / 10;
}

export function inToCm(inches: number): number {
  return Math.round(inches * CM_PER_IN * 10) / 10;
}
