import type { Metadata } from "next";
import { listAbandonedOrders } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/permissions";
import { rangeToDates, DEFAULT_TIME_RANGE } from "@/lib/admin/time-range";
import AbandonedView from "./AbandonedView";

export const metadata: Metadata = { title: "Abandoned carts" };

export default async function AbandonedCartsPage() {
  await requirePermission("abandoned_carts");
  const { start, end } = rangeToDates(DEFAULT_TIME_RANGE);
  const carts = await listAbandonedOrders(start, end);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Abandoned carts
      </h1>
      <div className="mt-6">
        <AbandonedView initial={carts} />
      </div>
    </div>
  );
}
