/** Normalizes a stored Iraqi phone number (typically local "07XX...") to
 * E.164 ("+9647XX..."), for WhatsApp links and ad-platform match data. */
export function toE164Iraq(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const national = digits.startsWith("964")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return `+964${national}`;
}
