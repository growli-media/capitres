import { toE164 } from "@/lib/phone";

/** Builds a wa.me click-to-chat link from a stored phone number (any
 * country, already E.164 for orders placed via international checkout). */
export function toWhatsAppLink(phone: string, message?: string): string {
  const intl = toE164(phone).replace("+", "");
  const base = `https://wa.me/${intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
