import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getGesCountries, getGesRates } from "@/lib/shipping/ges";
import { estimatePhysicalWeightKg } from "@/lib/shipping/weight";

interface RateQuoteInput {
  toCountry: string;
  /** Item count, not weight — weight is always derived server-side via
   * estimatePhysicalWeightKg(), so a manipulated client can't lie about
   * it even for this non-authoritative preview (checkout re-derives the
   * real charge from its own server-validated order lines regardless). */
  totalPhysicalQty: number;
}

/** Short-lived cache around the real GES call — collapses repeat lookups
 * for the same country+weight within a burst of checkouts, protecting
 * GES's 60/hour rate limit. Deliberately much shorter than
 * getGesCountries' 24h cache, since prices/availability shouldn't go
 * stale for long. */
const getCachedGesRates = unstable_cache(
  (toCountry: string, weightKg: number) => getGesRates(toCountry, weightKg),
  ["ges:rates"],
  { revalidate: 60 * 15 },
);

/** Live shipping-rate preview for the international checkout step (see
 * CheckoutFlow.tsx) — called once per destination-country selection, not
 * once per tier click (GES's /calculate already returns all four tiers
 * in one response). This is a preview only; /api/checkout re-fetches the
 * authoritative price at the moment of actually charging. */
export async function POST(request: NextRequest) {
  let input: RateQuoteInput;
  try {
    input = (await request.json()) as RateQuoteInput;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const toCountry = input.toCountry?.trim();
  if (!toCountry) {
    return NextResponse.json({ error: "invalid-country" }, { status: 400 });
  }

  let countries;
  try {
    countries = await getGesCountries();
  } catch (err) {
    console.error("[shipping/rates] Failed to load GES countries:", err);
    return NextResponse.json({ error: "rate-quote-failed" }, { status: 502 });
  }
  if (!countries.some((c) => c.countryName === toCountry)) {
    return NextResponse.json({ error: "invalid-country" }, { status: 400 });
  }

  const qty = Math.max(1, Math.min(200, Math.floor(Number(input.totalPhysicalQty) || 0)));
  const weightKg = estimatePhysicalWeightKg(qty);

  try {
    const quote = await getCachedGesRates(toCountry, weightKg);
    return NextResponse.json(quote);
  } catch (err) {
    console.error("[shipping/rates] GES rate quote failed:", err);
    return NextResponse.json({ error: "rate-quote-failed" }, { status: 502 });
  }
}
