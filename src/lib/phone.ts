/**
 * Normalizes a stored phone number to E.164, for WhatsApp links and
 * ad-platform match data.
 *
 * Orders placed through checkout now always store an already-E.164 number
 * (the phone input collects a dial code + local number and combines them
 * at submission — see CheckoutFlow.tsx) regardless of country, so those
 * pass through unchanged. Orders placed before international checkout
 * shipped predate country selection entirely and were always Iraqi, so a
 * bare/local-format number (no leading "+") falls back to the same
 * Iraq-only heuristic this function used to apply unconditionally.
 */
export function toE164(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  const national = digits.startsWith("964")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return `+964${national}`;
}
