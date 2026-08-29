"use server";

import { listAbandonedOrders, type AbandonedOrder } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/permissions";
import { rangeToDates, type TimeRangeKey } from "@/lib/admin/time-range";

export async function getAbandonedForRangeAction(rangeKey: TimeRangeKey): Promise<AbandonedOrder[]> {
  await requirePermission("abandoned_carts");
  const { start, end } = rangeToDates(rangeKey);
  return listAbandonedOrders(start, end);
}
