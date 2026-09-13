/**
 * Not a real GES tier — the customer-facing option offered only when GES
 * has no service for a destination at all (a quote came back
 * `available: false`), so checkout still has a way forward instead of a
 * dead end. Priced at the legacy flat SHIPPING_RATE_INTL
 * (src/lib/commerce/config.ts), kept around for exactly this fallback.
 *
 * Deliberately its own file, not ges.ts (which has `import "server-only"`
 * and can't be imported by value from a client component) — CheckoutFlow.tsx
 * and the checkout API route both need this exact string to agree on
 * what "use the fallback rate" means.
 */
export const FALLBACK_SHIPPING_METHOD = "Standard" as const;
