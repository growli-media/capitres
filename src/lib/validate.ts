/** Client-safe validators shared by forms. */

export function isValidEmailClient(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Iraqi mobile numbers: 07XX XXX XXXX (or +964 7XX XXX XXXX). */
export function isValidIraqiPhone(phone: string): boolean {
  const digits = phone.replace(/[\s\-()]/g, "");
  return /^(\+?964|0)?7\d{9}$/.test(digits);
}
