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
  customer: {
    firstName: string;
    middleName: string;
    lastName: string;
    email?: string;
    /** Already E.164 — CheckoutFlow combines the dial-code + local number
     * client-side before submitting. Re-validated here regardless, since
     * the client is never trusted for a payment-adjacent field. */
    phone: string;
    country: string;
    street?: string;
    streetNumber?: string;
    zip?: string;
    city?: string;
    state?: string;
    governorate?: string;
    notes?: string;
  };
  lines: CheckoutLineInput[];
}

/**
 * Creates an order and a Wayl hosted-payment link.
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
  const { firstName, middleName, lastName, email, phone, country } =
    input.customer ?? {};
  const emailTrimmed = email?.trim() ?? "";
  if (
    !firstName?.trim() ||
    !middleName?.trim() ||
    !lastName?.trim() ||
    (emailTrimmed && !isValidEmail(emailTrimmed)) ||
    !phone?.trim() ||
    !isValidPhoneNumber(phone ?? "") ||
    !country?.trim()
  ) {
    return NextResponse.json({ error: "invalid-customer" }, { status: 400 });
  }
  const hasPhysical = input.lines.some((l) => !l.giftCard);
  if (
    hasPhysical &&
    (!input.customer.street?.trim() ||
      !input.customer.streetNumber?.trim() ||
      !input.customer.city?.trim() ||
      (country === "IQ" && !input.customer.governorate?.trim()))
  ) {
    return NextResponse.json({ error: "invalid-address" }, { status: 400 });
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
  const totals = computeTotals(subtotal, promo, { physicalItems });

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

  let link;
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
    status: "Created",
    waylLinkId: link.id,
    paymentMethod: null,
    mock: link.mock,
    customer: {
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      email: emailTrimmed || undefined,
      phone: phone.trim(),
      country: country.trim(),
      street: input.customer.street?.trim(),
      streetNumber: input.customer.streetNumber?.trim(),
      zip: input.customer.zip?.trim(),
      city: input.customer.city?.trim(),
      state: input.customer.state?.trim(),
      governorate: country === "IQ" ? input.customer.governorate : undefined,
      notes: input.customer.notes?.slice(0, 500),
    },
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

  return NextResponse.json({
    ref,
    url: link.url,
    mock: isWaylMockMode(),
  });
}
