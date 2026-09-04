"use server";

import { sql } from "@/lib/db/client";
import { isAuthenticated } from "@/lib/admin/auth";
import { listRecentActivity, type ActivityEntry } from "@/lib/admin/activity";
import { PAID_STATUSES } from "@/lib/admin/queries-shared";
import { customerName } from "@/lib/orders/order-helpers";
import type { Order } from "@/lib/orders/order-helpers";

export async function listRecentActivityAction(limit = 20): Promise<ActivityEntry[]> {
  if (!(await isAuthenticated())) return [];
  return listRecentActivity(limit);
}

export interface NewOrderAlert {
  ref: string;
  customerName: string;
  total: number;
  createdAt: string;
}

interface NewOrderRow {
  ref: string;
  customer: Order["customer"];
  totals: { total: number };
  created_at: string | Date;
}

/**
 * Polled client-side (see NotificationBell.tsx) to surface a paid order
 * the moment it lands, without a refresh. Deliberately NOT written into
 * admin_activity_log — this runs independently per open browser tab with
 * an in-memory "since" cursor, and logging it server-side would need real
 * dedup across every admin's concurrent poll to avoid double-logging the
 * same order, which isn't worth the complexity for what's just a live
 * heads-up toast (the Orders list itself is still the source of truth).
 */
export async function checkNewOrdersAction(sinceIso: string): Promise<NewOrderAlert[]> {
  if (!(await isAuthenticated())) return [];
  const since = new Date(sinceIso);
  const rows = await sql<NewOrderRow[]>`
    select ref, customer, totals, created_at
    from orders
    where status = any(${PAID_STATUSES}) and deleted_at is null and created_at > ${since}
    order by created_at asc
    limit 20
  `;
  return rows.map((r) => ({
    ref: r.ref,
    customerName: customerName(r.customer) || "a customer",
    total: r.totals.total,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}
