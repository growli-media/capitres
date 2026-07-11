import "server-only";
import crypto from "node:crypto";

/**
 * Wayl payment gateway client — https://wayl.io
 *
 * API surface implemented from the official integration guide
 * (wayl.io/docs, base https://api.thewayl.com):
 *
 *   POST /api/v1/links              create a hosted payment link
 *   GET  /api/v1/links/{referenceId} check payment status
 *   POST /api/v1/refunds            request a refund
 *
 * Auth: `X-WAYL-AUTHENTICATION: <merchant token>` — server-side only.
 * Currency: IQD (integer amounts) — the only currency Wayl settles today.
 * Webhooks: HMAC-SHA256 hex digest of the raw body in `x-wayl-signature-256`.
 *
 * MOCK MODE: when WAYL_API_TOKEN is unset, the module transparently falls
 * back to a local simulated gateway (/{locale}/pay-mock) so the checkout
 * flow can be exercised end-to-end. Setting the env vars in .env.local is
 * the only change needed to go live — no code edits.
 */

const WAYL_BASE_URL = process.env.WAYL_BASE_URL ?? "https://api.thewayl.com";

export type WaylStatus =
  | "Created"
  | "Pending"
  | "Processing"
  | "Complete"
  | "Delivered"
  | "Cancelled"
  | "Rejected"
  | "Returned";

export interface WaylLineItem {
  label: string;
  amount: number; // integer IQD
  type: "increase" | "decrease";
}

export interface CreateWaylLinkArgs {
  referenceId: string;
  total: number; // integer IQD — must equal the sum of line items
  lineItems: WaylLineItem[];
  redirectionUrl: string;
  webhookUrl?: string;
  customParameter?: string;
}

export interface WaylLink {
  id: string;
  url: string;
  code: string;
  status: WaylStatus;
  paymentMethod: string | null;
  mock: boolean;
}

export function isWaylMockMode(): boolean {
  return !process.env.WAYL_API_TOKEN;
}

export async function createWaylPaymentLink(
  args: CreateWaylLinkArgs,
  mockCheckoutUrl: string,
): Promise<WaylLink> {
  if (isWaylMockMode()) {
    return {
      id: `mock_${args.referenceId}`,
      url: mockCheckoutUrl,
      code: args.referenceId.slice(-6).toUpperCase(),
      status: "Created",
      paymentMethod: null,
      mock: true,
    };
  }

  const res = await fetch(`${WAYL_BASE_URL}/api/v1/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WAYL-AUTHENTICATION": process.env.WAYL_API_TOKEN!,
    },
    body: JSON.stringify({
      env: process.env.WAYL_ENV === "live" ? "live" : "test",
      referenceId: args.referenceId,
      total: args.total,
      currency: "IQD",
      lineItem: args.lineItems,
      redirectionUrl: args.redirectionUrl,
      ...(args.webhookUrl
        ? {
            webhookUrl: args.webhookUrl,
            webhookSecret: process.env.WAYL_WEBHOOK_SECRET,
          }
        : {}),
      ...(args.customParameter
        ? { customParameter: args.customParameter }
        : {}),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Wayl link creation failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as {
    data: {
      id: string;
      url: string;
      code: string;
      status: WaylStatus;
      paymentMethod: string | null;
    };
  };

  return { ...json.data, mock: false };
}

export async function getWaylPaymentStatus(
  referenceId: string,
): Promise<{ status: WaylStatus; paymentMethod: string | null } | undefined> {
  if (isWaylMockMode()) return undefined;

  const res = await fetch(
    `${WAYL_BASE_URL}/api/v1/links/${encodeURIComponent(referenceId)}`,
    {
      headers: { "X-WAYL-AUTHENTICATION": process.env.WAYL_API_TOKEN! },
      cache: "no-store",
    },
  );
  if (!res.ok) return undefined;
  const json = (await res.json()) as {
    data: { status: WaylStatus; paymentMethod: string | null };
  };
  return json.data;
}

/** Constant-time HMAC-SHA256 verification of `x-wayl-signature-256`. */
export function verifyWaylSignature(
  rawBody: string,
  signatureHex: string | null,
  secret = process.env.WAYL_WEBHOOK_SECRET,
): boolean {
  if (!signatureHex || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  let b: Buffer;
  try {
    b = Buffer.from(signatureHex, "hex");
  } catch {
    return false;
  }
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}
