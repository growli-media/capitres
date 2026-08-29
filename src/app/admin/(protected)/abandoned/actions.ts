"use server";

import { listAbandonedOrders, type AbandonedOrder } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/permissions";
import { resolveTimeRange, type TimeRangeValue } from "@/lib/admin/time-range";

export async function getAbandonedForRangeAction(range: TimeRangeValue): Promise<AbandonedOrder[]> {
  await requirePermission("abandoned_carts");
  const { start, end } = resolveTimeRange(range);
  return listAbandonedOrders(start, end);
}
