import { NextRequest, NextResponse } from "next/server";
import { orderStore } from "@/lib/orders/store";
import { getWaylBatchStatus } from "@/lib/payments/wayl";
import { applyWaylStatus } from "@/lib/payments/sync-order";
import { logAdminActivity } from "@/lib/admin/activity";

/** Wayl's own maximum link lifetime (linkExpiresIn caps at 30d) — an
 * order older than this is a dead link on Wayl's side regardless, so
 * there's no point ever re-polling it. */
const MAX_LOOKBACK_DAYS = 30;
/** Wayl's batch endpoint caps a single request at 100 reference IDs. */
const BATCH_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Auto-sync for orders stuck on "Created"/"Pending"/"Processing" — the
 * safety net for when the Wayl webhook never arrives and nobody happens
 * to notice and click "Check Wayl" on the order page (OrderDetailActions.
 * tsx). Runs on a schedule (see vercel.json) rather than per-order, since
 * Wayl's batch endpoint covers up to 100 orders in one call. Reuses
 * applyWaylStatus() — the exact same write-and-claim-CAPI logic the
 * confirmation page's poll and the admin button already use.
 *
 * Locked down with Vercel's own CRON_SECRET convention: Vercel signs
 * every cron-triggered request with `Authorization: Bearer $CRON_SECRET`
 * automatically once that env var is set on the project — anyone else
 * hitting this URL gets 401. Never returns anything sensitive either way.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const since = new Date();
  since.setDate(since.getDate() - MAX_LOOKBACK_DAYS);
  const pending = await orderStore.listStalePending(since);
  if (pending.length === 0) {
    return NextResponse.json({ checked: 0, changed: 0 });
  }

  const byRef = new Map(pending.map((o) => [o.ref, o]));
  let changedCount = 0;

  for (const refs of chunk(pending.map((o) => o.ref), BATCH_SIZE)) {
    const remoteByRef = await getWaylBatchStatus(refs);
    for (const ref of refs) {
      const order = byRef.get(ref);
      const remote = remoteByRef.get(ref);
      if (!order || !remote) continue;
      const { changed } = await applyWaylStatus(order, remote);
      if (changed) changedCount += 1;
    }
  }

  if (changedCount > 0) {
    await logAdminActivity(
      `Auto-synced ${changedCount} order${changedCount === 1 ? "" : "s"} from Wayl (scheduled check)`,
    );
  }

  return NextResponse.json({ checked: pending.length, changed: changedCount });
}
