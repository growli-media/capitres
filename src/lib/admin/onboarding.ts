import "server-only";
import { sql } from "@/lib/db/client";
import { listAdminProducts } from "./products";
import { listAdminCollections } from "./collections";
import { listAllowlist } from "./allowlist";

export interface OnboardingStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

/** Cheap, one-shot checklist for a fresh install — not polled, just
 * computed on the Dashboard's own load. `allowlist.length > 1` reads as
 * "approved someone beyond the account that set the store up". */
export async function getOnboardingSteps(): Promise<OnboardingStep[]> {
  const [products, collections, allowlist, orderRows] = await Promise.all([
    listAdminProducts(),
    listAdminCollections(),
    listAllowlist(),
    sql<{ n: string }[]>`select count(*)::text as n from orders`,
  ]);
  return [
    { id: "product", label: "Add your first product", done: products.length > 0, href: "/admin/products/new" },
    { id: "collection", label: "Create a collection", done: collections.length > 0, href: "/admin/collections/new" },
    { id: "team", label: "Approve a team member", done: allowlist.length > 1, href: "/admin/team" },
    { id: "order", label: "Get your first order", done: Number(orderRows[0]?.n ?? 0) > 0, href: "/admin/orders" },
  ];
}
