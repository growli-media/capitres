import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

/** The owner's explicit choice — see the analytics feature's plan. */
const RETENTION_DAYS = 90;

/**
 * Rolling retention for anonymous visitor data — deletes visits (and,
 * via ON DELETE CASCADE, their visit_events) inactive for 90+ days.
 * orders.visitor_id is never touched: it's not a foreign key on purpose
 * (see schema.sql's comment on that column), so an order's own record
 * is unaffected once its visit ages out — the order's BrowsingTrail
 * just stops finding anything to show, same as it already does for any
 * visit that was never tracked in the first place.
 *
 * Same CRON_SECRET convention as sync-wayl-orders/route.ts — see that
 * file's comment for why this is safe to leave publicly routable.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const deleted = await sql<{ id: string }[]>`
    delete from visits where last_seen < ${cutoff} returning id
  `;

  return NextResponse.json({ deleted: deleted.length });
}
