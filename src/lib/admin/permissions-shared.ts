/**
 * Constants/types only — no "server-only", unlike permissions.ts (which
 * re-exports all of this). Needed as its own file because
 * EditPermissionsButton.tsx (a client component) imports these, and
 * "server-only" poisons an entire module for client bundling even when
 * the client only touches the parts that don't actually need the server.
 */

/**
 * Grantable admin sections — mirrors AdminNav.tsx's NAV_ITEMS minus
 * Dashboard (always visible to any authenticated user — just KPIs) and
 * Team (owner-only by construction, never grantable, so a permission
 * can't be used to escalate into managing other accounts).
 */
export const PERMISSIONS = [
  "products",
  "collections",
  "categories",
  "abandoned_carts",
  "orders",
  "reviews",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  products: "Products",
  collections: "Collections",
  categories: "Categories",
  abandoned_carts: "Abandoned carts",
  orders: "Orders",
  reviews: "Reviews",
};

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
