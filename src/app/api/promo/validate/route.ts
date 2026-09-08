import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/promo-codes";

/** Live-validates a promo code as the customer types it into the cart
 * drawer (see applyPromo() in src/lib/cart/store.ts) — checkout always
 * re-validates again server-side regardless, so this is purely for
 * showing "invalid/expired" feedback before the customer reaches
 * checkout, not itself a security boundary. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "missing-code" }, { status: 400 });
  }
  const promo = await validatePromoCode(code);
  if (!promo) {
    return NextResponse.json({ error: "invalid" }, { status: 404 });
  }
  return NextResponse.json({ promo });
}
