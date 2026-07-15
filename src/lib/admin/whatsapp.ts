import { toE164Iraq } from "@/lib/phone";

/** Builds a wa.me click-to-chat link from a stored Iraqi phone number
 * (typically local format, e.g. "0770 123 4567"). */
export function toWhatsAppLink(phone: string, message?: string): string {
  const intl = toE164Iraq(phone).replace("+", "");
  const base = `https://wa.me/${intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
