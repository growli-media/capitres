"use server";

import { sql } from "@/lib/db/client";
import { isAuthenticated } from "@/lib/admin/auth";
import { customerName } from "@/lib/orders/order-helpers";
import type { Order } from "@/lib/orders/order-helpers";

export interface SearchResult {
  type: "product" | "order" | "category" | "collection";
  label: string;
  sublabel?: string;
  href: string;
}

const RESULTS_PER_TYPE = 5;

/**
 * Backs the command palette's search box (⌘K) — products, orders,
 * categories, collections, matched by title/slug/ref/customer name.
 * Gated on isAuthenticated() (any admin session, including the legacy
 * shared-password login) rather than requireUserSession() — this only
 * surfaces *that something exists*, not its full detail, so it doesn't
 * need a named account the way Team management does; the destination
 * page enforces its own requirePermission() regardless.
 */
export async function searchAdminAction(query: string): Promise<SearchResult[]> {
  if (!(await isAuthenticated())) return [];

  const q = query.trim();
  if (q.length < 2) return [];
  const like = `%${q}%`;

  const [products, orders, categories, collections] = await Promise.all([
    sql<{ id: string; slug: string; title_en: string }[]>`
      select id, slug, title_en from products
      where title_en ilike ${like} or slug ilike ${like}
      order by title_en asc
      limit ${RESULTS_PER_TYPE}
    `,
    sql<{ ref: string; customer: Order["customer"] }[]>`
      select ref, customer from orders
      where deleted_at is null
        and (ref ilike ${like}
          or customer->>'firstName' ilike ${like}
          or customer->>'lastName' ilike ${like}
          or customer->>'fullName' ilike ${like}
          or customer->>'phone' ilike ${like})
      order by created_at desc
      limit ${RESULTS_PER_TYPE}
    `,
    sql<{ slug: string; title_en: string }[]>`
      select slug, title_en from categories where title_en ilike ${like} limit ${RESULTS_PER_TYPE}
    `,
    sql<{ slug: string; title_en: string }[]>`
      select slug, title_en from collections where title_en ilike ${like} limit ${RESULTS_PER_TYPE}
    `,
  ]);

  return [
    ...products.map((p) => ({
      type: "product" as const,
      label: p.title_en,
      sublabel: `/${p.slug}`,
      href: `/admin/products/${p.id}/edit`,
    })),
    ...orders.map((o) => ({
      type: "order" as const,
      label: o.ref,
      sublabel: customerName(o.customer) || undefined,
      href: `/admin/orders/${o.ref}`,
    })),
    ...categories.map((c) => ({
      type: "category" as const,
      label: c.title_en,
      href: `/admin/categories/${c.slug}/edit`,
    })),
    ...collections.map((c) => ({
      type: "collection" as const,
      label: c.title_en,
      href: `/admin/collections/${c.slug}/edit`,
    })),
  ];
}
