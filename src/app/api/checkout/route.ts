import { NextRequest, NextResponse } from "next/server";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { catalog } from "@/lib/catalog";
import { computeTotals, findPromo } from "@/lib/commerce/config";
import {
  createWaylPaymentLink,
  isWaylMockMode,
  type WaylLineItem,
} from "@/lib/payments/wayl";
import { newOrderRef, orderStore, type OrderLine } from "@/lib/orders/store";
import { isValidEmail } from "@/lib/server/records";
import { sendMetaPurchaseEvent } from "@/lib/analytics/meta-capi";

interface CheckoutLineInput {
  productSlug: string;
  variantId?: string;
  colorKey?: string;
  qty: number;
  giftCard?: {
    denomination: number;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    message: string;
  };
}

interface CheckoutInput {
  locale: string;
  promoCode?: string;
  /** "wayl" (card/wallet, redirects to Wayl's hosted page — no customer
   * data collected on our side, Wayl's own page asks for it) or "cod"
   * (Cash on Delivery, Iraq-only, collected directly on our form). */
  paymentMethod?: "wayl" | "cod";
  /** The region choice made at the top of checkout — drives the shipping
   * rate (5,000 IQD domestic vs. 50,000 IQD international). Required for
   * "wayl" (the only signal we have, since that path collects no address
   * on our side); ignored for "cod", which is always "IQ" by construction. */
  region?: "IQ" | "INTL";
  /** Required only when paymentMethod === "cod". Iraq-only by
   * construction — no country field, since COD never ships elsewhere. */
  customer?: {
    firstName: string;
    middleName: string;
    lastName: string;
    email?: string;
    /** Already E.164 — CheckoutFlow formats it client-side before
     * submitting. Re-validated here regardless, since the client is
     * never trusted for a payment-adjacent field. */
    phone: string;
    street: string;
    streetNumber: string;
    city: string;
    governorate: string;
    notes?: string;
  };
  lines: CheckoutLineInput[];
}

/**
 * Creates an order and, for card payments, a Wayl hosted-payment link.
 * Prices are always re-derived from the catalog on the server — the
 * client's cart snapshot is never trusted for amounts.
 */
export async function POST(request: NextRequest) {
  let input: CheckoutInput;
  try {
    input = (await request.json()) as CheckoutInput;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const locale = ["en", "ar", "ku"].includes(input.locale)
    ? input.locale
    : "en";

  if (!input.lines?.length) {
    return NextResponse.json({ error: "empty-cart" }, { status: 400 });
  }

  const paymentMethod = input.paymentMethod === "cod" ? "cod" : "wayl";
  const hasPhysical = input.lines.some((l) => !l.giftCard);

  if (paymentMethod === "cod" && !hasPhysical) {
    return NextResponse.json({ error: "cod-unavailable" }, { status: 400 });
  }

  if (paymentMethod === "wayl" && input.region !== "IQ" && input.region !== "INTL") {
    return NextResponse.json({ error: "invalid-region" }, { status: 400 });
  }
  const region: "IQ" | "INTL" = paymentMethod === "cod" ? "IQ" : input.region!;

  const c = input.customer;
  const emailTrimmed = c?.email?.trim() ?? "";
  if (paymentMethod === "cod") {
    if (
      !c?.firstName?.trim() ||
      !c?.middleName?.trim() ||
      !c?.lastName?.trim() ||
      !c?.phone?.trim() ||
      !isValidPhoneNumber(c?.phone ?? "") ||
      (emailTrimmed && !isValidEmail(emailTrimmed)) ||
      !c?.governorate?.trim() ||
      !c?.city?.trim() ||
      !c?.street?.trim() ||
      !c?.streetNumber?.trim()
    ) {
      return NextResponse.json({ error: "invalid-customer" }, { status: 400 });
    }
  }

  const orderLines: OrderLine[] = [];
  const waylLineItems: WaylLineItem[] = [];

  for (const line of input.lines) {
    const product = await catalog.getProduct(line.productSlug);
    if (!product) {
      return NextResponse.json(
        { error: "unknown-product", slug: line.productSlug },
        { status: 400 },
      );
    }
    const qty = Math.max(1, Math.min(20, Math.floor(line.qty)));

    if (product.giftCard) {
      const denomination = line.giftCard?.denomination;
      if (
        !denomination ||
        !product.giftCard.denominations.includes(denomination) ||
        !isValidEmail(line.giftCard?.recipientEmail ?? "")
      ) {
        return NextResponse.json({ error: "invalid-gift-card" }, { status: 400 });
      }
      orderLines.push({
        productSlug: product.slug,
        title: product.title.en,
        qty,
        unitAmount: denomination,
        giftCard: {
          denomination,
          recipientEmail: line.giftCard!.recipientEmail.trim(),
          recipientName: line.giftCard!.recipientName?.trim() ?? "",
          senderName: line.giftCard!.senderName?.trim() ?? "",
          message: line.giftCard!.message?.slice(0, 500) ?? "",
        },
      });
      waylLineItems.push({
        label: `${product.title.en} (${denomination.toLocaleString("en-US")} IQD) x${qty}`,
        amount: denomination * qty,
        type: "increase",
      });
      continue;
    }

    const variant = product.variants.find((v) => v.id === line.variantId);
    if (!variant) {
      return NextResponse.json(
        { error: "unknown-variant", slug: line.productSlug },
        { status: 400 },
      );
    }
    if (variant.stock < qty) {
      return NextResponse.json(
        { error: "insufficient-stock", slug: line.productSlug, size: variant.size },
        { status: 409 },
      );
    }
    const color = line.colorKey
      ? product.colors.find((c) => c.key === line.colorKey)
      : undefined;

    orderLines.push({
      productSlug: product.slug,
      title: product.title.en,
      size: variant.size,
      color: color?.name.en,
      qty,
      unitAmount: product.price.amount,
    });
    waylLineItems.push({
      label: `${product.title.en}${color ? ` (${color.name.en})` : ""} ${variant.size} x${qty}`,
      amount: product.price.amount * qty,
      type: "increase",
    });
  }

  const subtotal = orderLines.reduce((s, l) => s + l.unitAmount * l.qty, 0);
  const promo = input.promoCode ? findPromo(input.promoCode) : undefined;
  const physicalItems = orderLines.some((l) => !l.giftCard);
  const totals = computeTotals(subtotal, promo, { physicalItems, region });

  if (totals.discount > 0) {
    waylLineItems.push({
      label: `Discount ${promo!.code}`,
      amount: totals.discount,
      type: "decrease",
    });
  }
  if (totals.shipping > 0) {
    waylLineItems.push({
      label: "Shipping",
      amount: totals.shipping,
      type: "increase",
    });
  }

  const ref = newOrderRef();
  const origin = request.nextUrl.origin;
  const confirmationUrl = `${origin}/${locale}/checkout/confirmation?ref=${ref}`;
  const mockCheckoutUrl = `${origin}/${locale}/pay-mock?ref=${ref}`;
  // Wayl requires HTTPS webhook URLs — localhost dev runs without one.
  const webhookUrl = origin.startsWith("https://")
    ? `${origin}/api/webhooks/wayl`
    : undefined;

  let link: Awaited<ReturnType<typeof createWaylPaymentLink>> | undefined;
  if (paymentMethod === "wayl") {
    try {
      link = await createWaylPaymentLink(
        {
          referenceId: ref,
          total: totals.total,
          lineItems: waylLineItems,
          redirectionUrl: confirmationUrl,
          webhookUrl,
          customParameter: JSON.stringify({ locale }),
        },
        mockCheckoutUrl,
      );
    } catch (err) {
      console.error("[checkout] Wayl link creation failed:", err);
      return NextResponse.json({ error: "payment-init" }, { status: 502 });
    }
  }

  // Captured here because this is the one request in the whole payment
  // flow that's actually the customer's browser — the Wayl webhook that
  // later confirms payment is server-to-server and sees none of this.
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const fbp = request.cookies.get("_fbp")?.value;
  const fbc = request.cookies.get("_fbc")?.value;

  await orderStore.create({
    ref,
    createdAt: new Date().toISOString(),
    locale,
    status: paymentMethod === "cod" ? "CashOnDelivery" : "Created",
    waylLinkId: link?.id,
    paymentMethod: paymentMethod === "cod" ? "CashOnDelivery" : null,
    mock: link?.mock ?? false,
    // "wayl" orders start with nothing — we no longer ask for anything
    // before redirecting, so Wayl's own hosted page doesn't ask twice.
    // The webhook backfills this once the customer tells Wayl who they
    // are (see src/app/api/webhooks/wayl/route.ts).
    customer:
      paymentMethod === "cod"
        ? {
            firstName: c!.firstName.trim(),
            middleName: c!.middleName.trim(),
            lastName: c!.lastName.trim(),
            email: emailTrimmed || undefined,
            phone: c!.phone.trim(),
            country: "IQ",
            street: c!.street.trim(),
            streetNumber: c!.streetNumber.trim(),
            city: c!.city.trim(),
            governorate: c!.governorate.trim(),
            notes: c!.notes?.slice(0, 500),
          }
        : { country: region },
    lines: orderLines,
    totals: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
    },
    promoCode: promo?.code,
    adTracking:
      clientIp || userAgent || fbp || fbc
        ? { clientIp, userAgent, fbp, fbc }
        : undefined,
  });

  if (paymentMethod === "cod") {
    // COD orders never touch Wayl, so the webhook that normally fires
    // this never runs — send it here instead, right after the order is
    // durably created.
    const claimed = await orderStore.claimForMetaCapi(ref);
    if (claimed) await sendMetaPurchaseEvent(claimed);
  }

  return NextResponse.json({
    ref,
    url: paymentMethod === "cod" ? confirmationUrl : link!.url,
    mock: paymentMethod === "cod" ? false : isWaylMockMode(),
  });
}
