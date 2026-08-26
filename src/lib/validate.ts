/** Client-safe validators shared by forms. */

import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js/min";

export function isValidEmailClient(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** International mobile/landline check — `country` is the dial-code
 * country selected alongside the number, not the shipping country (a
 * customer can ship to one country and carry a phone from another). */
export function isValidPhone(number: string, country: CountryCode): boolean {
  return isValidPhoneNumber(number, country);
}
