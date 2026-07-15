"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, CircleNotch, XCircle } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart/store";
import { formatIQD } from "@/lib/money";
import { trackPurchase } from "@/lib/analytics/track";

interface OrderView {
  ref: string;
  status: string;
  mock: boolean;
  email: string;
  phone: string;
  totals: { subtotal: number; discount: number; shipping: number; total: number };
  lines: {
    productSlug: string;
    title: string;
    size?: string;
    qty: number;
    unitAmount: number;
    isGiftCard: boolean;
  }[];
  hasGiftCards: boolean;
}

const PAID = ["Complete", "Delivered", "MockPaid"];
const FAILED = ["Cancelled", "Rejected", "Returned"];

/**
 * Polls the order status after returning from the (real or mock) Wayl
 * gateway. Clears the cart exactly once when payment confirms.
 */
export default function ConfirmationClient({ orderRef }: { orderRef: string }) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const clearCart = useCart((s) => s.clear);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const clearedRef = useRef(false);
  const purchaseTrackedRef = useRef(false);
  const attemptsRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderRef)}`, {
        cache: "no-store",
      });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = (await res.json()) as OrderView;
      setOrder(data);
      if (PAID.includes(data.status) && !clearedRef.current) {
        clearedRef.current = true;
        clearCart();
      }
      if (PAID.includes(data.status) && !purchaseTrackedRef.current) {
        purchaseTrackedRef.current = true;
        trackPurchase({
          ref: data.ref,
          total: data.totals.total,
          email: data.email,
          phone: data.phone,
          items: data.lines.map((l) => ({
            slug: l.productSlug,
            title: l.title,
            price: l.unitAmount,
            qty: l.qty,
          })),
        });
      }
    } catch {
      // network hiccup — the interval will retry
    }
  }, [orderRef, clearCart]);

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      attemptsRef.current += 1;
      const done =
        attemptsRef.current > 40 ||
        (order && (PAID.includes(order.status) || FAILED.includes(order.status)));
      if (done) {
        clearInterval(id);
        return;
      }
      void load();
    }, 2500);
    return () => clearInterval(id);
  }, [load, order]);

  if (notFound) {
    return (
      <div className="container-x flex flex-col items-center py-28 text-center">
        <XCircle size={56} className="text-danger" aria-hidden="true" />
        <h1 className="text-display mt-6 text-4xl">{t("confirmFailed")}</h1>
        <Link href="/shop" className="btn btn-ink mt-8">
          {t("backToShop")}
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-x flex flex-col items-center py-32 text-center">
        <CircleNotch
          size={40}
          aria-hidden="true"
          className="animate-spin text-ink/40"
        />
        <p role="status" className="mt-6 font-semibold text-ink/60">
          {t("confirmPending")}
        </p>
      </div>
    );
  }

  const paid = PAID.includes(order.status);
  const failed = FAILED.includes(order.status);
  const statusKey = order.status as
    | "Created"
    | "Pending"
    | "Processing"
    | "Complete"
    | "Delivered"
    | "Cancelled"
    | "Rejected"
    | "Returned"
    | "MockPaid";

  return (
    <div className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <div>
        {paid ? (
          <>
            <CheckCircle
              size={56}
              weight="fill"
              className="text-green"
              aria-hidden="true"
            />
            <h1 className="text-display mt-6 text-4xl md:text-6xl">
              {t("confirmTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">
              {t("confirmBody", { ref: order.ref, email: order.email })}
            </p>
            {order.hasGiftCards && (
              <p className="mt-4 max-w-xl border-s-2 border-green bg-studio p-4 text-sm leading-relaxed text-ink/75">
                {t("confirmGiftCards")}
              </p>
            )}
          </>
        ) : failed ? (
          <>
            <XCircle size={56} className="text-danger" aria-hidden="true" />
            <h1 className="text-display mt-6 text-4xl md:text-6xl">
              {t("confirmFailed")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">
              {t("confirmFailedBody")}
            </p>
            <Link href="/checkout" className="btn btn-ink mt-8">
              {t("tryAgain")}
            </Link>
          </>
        ) : (
          <>
            <CircleNotch
              size={48}
              aria-hidden="true"
              className="animate-spin text-ink/40"
            />
            <h1 className="text-display mt-6 text-3xl md:text-5xl">
              {t("confirmPending")}
            </h1>
          </>
        )}

        <dl className="mt-10 grid max-w-md grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
          <div>
            <dt className="text-ink/60">{t("orderRef")}</dt>
            <dd className="price mt-1 font-bold">{order.ref}</dd>
          </div>
          <div>
            <dt className="text-ink/60">{t("statusLabel")}</dt>
            <dd
              className={`mt-1 font-bold ${
                paid ? "text-green" : failed ? "text-danger" : "text-ink"
              }`}
            >
              {t(`statuses.${statusKey}`)}
            </dd>
          </div>
        </dl>

        {paid && (
          <Link href="/shop" className="btn btn-outline mt-10">
            {t("backToShop")}
          </Link>
        )}
      </div>

      {/* Order summary */}
      <aside
        aria-label={t("orderSummary")}
        className="h-fit border border-line bg-white p-6"
      >
        <h2 className="text-eyebrow text-ink/60">{t("orderSummary")}</h2>
        <ul className="mt-4 divide-y divide-line text-sm">
          {order.lines.map((l, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{l.title}</p>
                <p className="text-xs text-ink/65">
                  {l.size ?? ""} ×{l.qty}
                </p>
              </div>
              <p className="price font-semibold">
                {formatIQD(l.unitAmount * l.qty, locale)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {order.totals.discount > 0 && (
            <div className="flex justify-between text-green">
              <dt>{t("discount")}</dt>
              <dd className="price">
                −{formatIQD(order.totals.discount, locale)}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink/60">{t("shipping")}</dt>
            <dd className="price">
              {order.totals.shipping === 0
                ? t("shippingFree")
                : formatIQD(order.totals.shipping, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
            <dt>{t("total")}</dt>
            <dd className="price">{formatIQD(order.totals.total, locale)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
