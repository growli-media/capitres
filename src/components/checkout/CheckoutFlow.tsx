"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  CaretLeft,
  CircleNotch,
  Globe,
  LockSimple,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react";
import { parsePhoneNumber } from "libphonenumber-js/min";
import { Link, useRouter } from "@/i18n/navigation";
import {
  useCart,
  useCartPromo,
  useCartTotals,
  useCartTotalsByCurrency,
  type CartLine,
} from "@/lib/cart/store";
import { pick } from "@/lib/content";
import { convertFromIqd, formatCurrency, formatIQD, IQD_PER_USD } from "@/lib/money";
import { isValidEmailClient, isValidPhone } from "@/lib/validate";
import { trackInitiateCheckout } from "@/lib/analytics/track";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import type { GesCountry, GesRateQuote, GesTierName } from "@/lib/shipping/ges";

/** Country name pre-localized server-side — see checkout/page.tsx for why
 * (Chromium's own ICU data has no Kurdish region names, so this can't be
 * computed client-side with Intl.DisplayNames). `countryName` stays the
 * English name GES itself expects and is what actually gets submitted;
 * `displayName` is only ever shown to the customer. */
export type LocalizedGesCountry = GesCountry & { displayName: string };
import { FALLBACK_SHIPPING_METHOD } from "@/lib/shipping/constants";
import { SHIPPING_RATE_INTL, SHIPPING_RATE_INTL_USD } from "@/lib/commerce/config";

const GOVERNORATES = [
  "baghdad",
  "basra",
  "erbil",
  "sulaymaniyah",
  "duhok",
  "nineveh",
  "kirkuk",
  "najaf",
  "karbala",
  "anbar",
  "babil",
  "diyala",
  "wasit",
  "maysan",
  "dhiqar",
  "muthanna",
  "qadisiyyah",
  "salahaddin",
  "halabja",
] as const;

/** Cash-on-Delivery is Iraq-only, so this form never needs a country
 * selector, a phone dial-code picker, or state/zip — all of that lives
 * on Wayl's own hosted page for the card-payment path instead (see
 * CheckoutFlow's region/method chooser below). */
interface CodInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  governorate: string;
  /** City/district — the neighborhood-level area (المنطقة), the level
   * Iraqi addresses actually use below governorate. */
  city: string;
  /** Nearest landmark/point of interest — Iraqi addresses have no formal
   * street-naming/numbering convention, so this is the only street-level
   * detail collected, alongside governorate + city/district. */
  landmark: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof CodInfo, string>>;

/** Iraq's border outline, traced from Natural Earth admin-0 boundary
 * data (public domain) — not a stock icon, since no icon set carries a
 * per-country shape. Projected with a cos(latitude) correction so the
 * silhouette isn't stretched east-west at this latitude. */
function IraqMapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor" aria-hidden="true">
      <path
        d="M 67.50 16.99 L 74.10 20.61 L 74.85 27.66 L 69.79 31.83 L 67.46 41.24 L 74.43 52.71
           L 86.75 59.33 L 91.92 68.50 L 90.27 77.24 L 93.49 77.24 L 93.59 83.67 L 99.15 90.01
           L 93.18 89.42 L 86.43 88.41 L 79.05 100.00 L 60.35 99.04 L 32.00 74.77 L 17.02 66.32
           L 4.90 63.05 L 0.85 48.35 L 23.11 35.79 L 26.91 21.20 L 25.96 12.39 L 31.47 9.41
           L 36.62 1.88 L 40.94 0.00 L 52.64 1.56 L 56.17 4.63 L 60.99 2.59 Z"
      />
    </svg>
  );
}

function SummaryLine({ line, locale }: { line: CartLine; locale: string }) {
  const t = useTranslations("cart");
  const { currency } = useCurrency();
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="relative h-16 w-13 shrink-0 overflow-hidden bg-paper">
        <Image
          src={line.image.src}
          alt=""
          fill
          sizes="52px"
          className="object-cover"
        />
        <span className="price absolute -end-0 -top-0 flex h-5 min-w-5 items-center justify-center bg-ink px-1 text-[10px] font-bold text-paper">
          {line.qty}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {pick(line.title, locale)}
        </p>
        <p className="text-xs text-ink/65">
          {line.giftCard
            ? t("giftCardFor", { email: line.giftCard.recipientEmail })
            : [line.colorName ? pick(line.colorName, locale) : null, line.size]
                .filter(Boolean)
                .join(" — ")}
        </p>
      </div>
      <p className="price text-sm font-semibold">
        {formatCurrency(line.unitAmountByCurrency[currency] * line.qty, currency, locale)}
      </p>
    </li>
  );
}

export default function CheckoutFlow({ countries }: { countries: LocalizedGesCountry[] }) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tGov = useTranslations("governorates");
  const router = useRouter();
  const { lines, promoCode, hasHydrated } = useCart();
  const promo = useCartPromo();
  const { currency } = useCurrency();
  const tCurrency = useTranslations("currency");

  // Region/payment-method chooser — derived rendering instead of a
  // linear step machine, since which screen comes next depends on both.
  const [region, setRegion] = useState<"IQ" | "INTL" | null>(null);
  const [method, setMethod] = useState<"card" | "cod" | null>(null);

  // International shipping: destination + GES Express rate quote. The
  // customer can click freely between tiers (setSelectedTier only ever
  // highlights — never navigates) and only reaches Wayl by explicitly
  // confirming. No tier is pre-selected — this is a money choice, not a
  // default to accept.
  const [destinationCountry, setDestinationCountry] = useState<string | null>(null);
  const [rateQuote, setRateQuote] = useState<GesRateQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(false);
  const [selectedTier, setSelectedTier] = useState<GesTierName | typeof FALLBACK_SHIPPING_METHOD | null>(
    null,
  );
  const [intlConfirmed, setIntlConfirmed] = useState(false);
  // A monotonically increasing id so a slow, now-stale response (the
  // customer already picked a different country) can't overwrite a
  // newer one that resolved first.
  const quoteRequestIdRef = useRef(0);

  // A promo applied earlier in the cart drawer (before region was known)
  // might be restricted to the other region — price the order as if no
  // promo were applied at all in that case, matching exactly what
  // checkout will independently enforce server-side, rather than showing
  // a discount here and rejecting it only at final submit.
  const regionMismatch = Boolean(promo?.region && region && promo.region !== region);
  const effectivePromoCode = regionMismatch ? undefined : promoCode;

  const hasPhysical = lines.some((l) => !l.giftCard);
  // A gift-card-only cart never ships anywhere, domestic or not — skip
  // the whole GES step for it, same as computeTotals already treats it
  // as automatically free-shipping.
  const requiresIntlShipping = region === "INTL" && hasPhysical;
  const totalPhysicalQty = lines.filter((l) => !l.giftCard).reduce((sum, l) => sum + l.qty, 0);

  // Live preview only — never trusted for the actual charge, which
  // /api/checkout re-fetches from GES itself at submit time.
  const selectedPriceUsd =
    selectedTier === FALLBACK_SHIPPING_METHOD
      ? SHIPPING_RATE_INTL_USD
      : rateQuote?.available && selectedTier
        ? rateQuote.tiers.find((tier) => tier.name === selectedTier)?.priceUsd
        : undefined;
  const shippingAmountIntl =
    selectedPriceUsd !== undefined ? Math.round(selectedPriceUsd * IQD_PER_USD) : undefined;

  // Shipping is region-dependent (5,000 IQD domestic, a real GES Express
  // quote once picked international) — defaults to domestic before a
  // region is chosen, matching computeTotals' own default, then updates
  // once picked.
  const totals = useCartTotals(region ?? "IQ", regionMismatch ? null : undefined, shippingAmountIntl);
  const displayTotals = useCartTotalsByCurrency(
    currency,
    region ?? "IQ",
    regionMismatch ? null : undefined,
    shippingAmountIntl,
  );
  const [info, setInfo] = useState<CodInfo>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    governorate: "",
    city: "",
    landmark: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Cash on Delivery doesn't make sense for a gift-card-only cart — if
  // the cart changes out from under an already-open COD form, bounce
  // back to the method chooser rather than let an invalid order submit.
  useEffect(() => {
    if (method === "cod" && !hasPhysical) setMethod(null);
  }, [method, hasPhysical]);

  // Triggered directly from the country <select>'s onChange and the
  // "try again" button below — not a reactive effect, since the fetch is
  // always the direct result of a specific user action, never something
  // that should silently re-run on its own. Called once per destination
  // pick (not once per tier click — GES's /calculate already returns all
  // four tiers together in one response).
  async function quoteShipping(country: string) {
    setDestinationCountry(country);
    setRateQuote(null);
    setSelectedTier(null);
    setQuoteError(false);
    setQuoteLoading(true);
    const requestId = ++quoteRequestIdRef.current;
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toCountry: country, totalPhysicalQty }),
      });
      if (!res.ok) throw new Error("rate-quote-failed");
      const quote = (await res.json()) as GesRateQuote;
      if (requestId !== quoteRequestIdRef.current) return; // a newer pick already superseded this one
      setRateQuote(quote);
    } catch {
      if (requestId !== quoteRequestIdRef.current) return;
      setQuoteError(true);
    } finally {
      if (requestId === quoteRequestIdRef.current) setQuoteLoading(false);
    }
  }

  const checkoutTrackedRef = useRef(false);
  useEffect(() => {
    if (!hasHydrated || lines.length === 0 || checkoutTrackedRef.current) return;
    checkoutTrackedRef.current = true;
    trackInitiateCheckout(
      lines.map((l) => ({
        slug: l.productSlug,
        title: pick(l.title, locale),
        price: l.unitAmount,
        qty: l.qty,
      })),
      totals.total,
    );
  }, [hasHydrated, lines, locale, totals.total]);

  // The order summary sits above the choice cards on purpose — customers
  // land on the two big decisions first, and can scroll up if they want
  // to double-check what's in the cart. Each time a new pair of cards
  // appears (region, then payment method), bring them into view instead
  // of leaving the customer looking at the order summary.
  const regionCardsRef = useRef<HTMLDivElement>(null);
  const methodCardsRef = useRef<HTMLDivElement>(null);
  const intlShippingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (region === null && hasHydrated && lines.length > 0) {
      regionCardsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [region, hasHydrated, lines.length]);
  useEffect(() => {
    if (region === "IQ" && method === null) {
      methodCardsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [region, method]);
  useEffect(() => {
    if (requiresIntlShipping && !intlConfirmed) {
      intlShippingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [requiresIntlShipping, intlConfirmed]);

  if (!hasHydrated) {
    return (
      <div className="container-x py-24">
        <div className="mx-auto h-40 max-w-xl animate-pulse bg-studio" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-x flex flex-col items-center py-28 text-center">
        <h1 className="text-display text-4xl">{tCart("empty")}</h1>
        <p className="mt-3 text-ink/60">{tCart("emptySub")}</p>
        <Link href="/shop" className="btn btn-ink mt-8">
          {tCart("emptyCta")}
        </Link>
      </div>
    );
  }

  function setField<K extends keyof CodInfo>(k: K, v: CodInfo[K]) {
    setInfo((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  function validateCod(): boolean {
    const next: FieldErrors = {};
    if (!info.firstName.trim()) next.firstName = t("errors.required");
    if (!info.middleName.trim()) next.middleName = t("errors.required");
    if (!info.lastName.trim()) next.lastName = t("errors.required");
    if (info.email.trim() && !isValidEmailClient(info.email)) {
      next.email = t("errors.invalidEmail");
    }
    if (!isValidPhone(info.phoneNumber, "IQ")) {
      next.phoneNumber = t("errors.invalidPhone");
    }
    if (!info.governorate) next.governorate = t("errors.required");
    if (!info.city.trim()) next.city = t("errors.required");
    if (!info.landmark.trim()) next.landmark = t("errors.required");
    setErrors(next);
    const firstError = Object.entries(next).find(([, v]) => v);
    if (firstError) {
      document.getElementById(`co-${firstError[0]}`)?.focus();
      return false;
    }
    return true;
  }

  async function payWayl() {
    setBusy(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          promoCode: effectivePromoCode,
          paymentMethod: "wayl",
          region: region ?? "IQ",
          // Name only — the server always re-fetches the authoritative
          // price from GES itself at submit time, never trusts a
          // client-reported amount.
          shippingCountry: requiresIntlShipping ? (destinationCountry ?? undefined) : undefined,
          shippingMethod: requiresIntlShipping ? (selectedTier ?? undefined) : undefined,
          lines: lines.map((l) => ({
            productSlug: l.productSlug,
            variantId: l.variantId,
            colorKey: l.colorKey,
            qty: l.qty,
            giftCard: l.giftCard,
          })),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setSubmitError(t("errors.paymentInit"));
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setSubmitError(t("errors.paymentInit"));
      setBusy(false);
    }
  }

  async function submitCod(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCod()) return;
    setBusy(true);
    setSubmitError(null);
    try {
      let phoneE164 = info.phoneNumber;
      try {
        phoneE164 = parsePhoneNumber(info.phoneNumber, "IQ").format("E.164");
      } catch {
        // validateCod() already ran, so this shouldn't happen — the
        // server re-validates regardless.
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          promoCode: effectivePromoCode,
          paymentMethod: "cod",
          customer: {
            firstName: info.firstName,
            middleName: info.middleName,
            lastName: info.lastName,
            email: info.email.trim() || undefined,
            phone: phoneE164,
            landmark: info.landmark,
            city: info.city,
            governorate: info.governorate,
            notes: info.notes || undefined,
          },
          lines: lines.map((l) => ({
            productSlug: l.productSlug,
            variantId: l.variantId,
            colorKey: l.colorKey,
            qty: l.qty,
            giftCard: l.giftCard,
          })),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setSubmitError(t("errors.paymentInit"));
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setSubmitError(t("errors.paymentInit"));
      setBusy(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `h-12 w-full border bg-white px-4 text-base outline-none transition-colors focus:border-ink ${
      hasError ? "border-danger" : "border-line"
    }`;

  const steps = [t("stepShipping"), t("stepConfirm")];
  const showIntlShipping = requiresIntlShipping && !intlConfirmed;
  const showWayl = method === "card" || (region === "INTL" && (!requiresIntlShipping || intlConfirmed));
  const showMethodChoice = region === "IQ" && method === null;
  const showCod = region === "IQ" && method === "cod";

  function backFromWayl() {
    setSubmitError(null);
    if (region === "INTL") {
      // A gift-card-only cart skips the shipping-options screen
      // entirely (nothing to quote), so there's nothing to go "back"
      // to there — return to the region picker instead, exactly like
      // this button already behaved before the GES step existed.
      if (requiresIntlShipping) setIntlConfirmed(false);
      else setRegion(null);
    } else {
      setMethod(null);
    }
  }

  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="text-display text-4xl md:text-6xl">{t("title")}</h1>

      <ol
        aria-label={t("stepLabel", { current: 1, total: steps.length })}
        className="mt-8 flex flex-wrap items-center gap-2 text-sm"
      >
        {steps.map((label, i) => {
          const n = i + 1;
          const state = n === 1 ? "current" : "next";
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={`flex items-center gap-2 px-3 py-2 font-semibold ${
                  state === "current" ? "bg-ink text-paper" : "bg-studio text-ink/60"
                }`}
              >
                <span className="price">{n}</span>
                {label}
              </span>
              {n < steps.length && (
                <span aria-hidden="true" className="text-ink/30">
                  —
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mx-auto mt-10 max-w-2xl">
        {/* Order summary — deliberately above the choice cards. The
            page auto-scrolls past this to focus the customer on the
            decision; scrolling up gets them back here. */}
        <aside aria-label={t("orderSummary")} className="border border-line bg-white p-6">
          <h2 className="text-eyebrow text-ink/60">{t("orderSummary")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {lines.map((l) => (
              <SummaryLine key={l.key} line={l} locale={locale} />
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">{tCart("subtotal")}</dt>
              <dd className="price font-semibold">
                {formatCurrency(displayTotals.subtotal, currency, locale)}
              </dd>
            </div>
            {regionMismatch && promo && (
              <p className="text-xs text-danger">{t("promoRegionMismatch", { code: promo.code })}</p>
            )}
            {!regionMismatch && promo?.type === "bogo" && (
              <p className="text-xs text-ink/60">{t("promoBogoApplied", { code: promo.code })}</p>
            )}
            {!regionMismatch && displayTotals.discount > 0 && promo && (
              <div className="flex justify-between text-green">
                <dt>
                  {t("discount")} ({promo.code})
                </dt>
                <dd className="price font-semibold">
                  −{formatCurrency(displayTotals.discount, currency, locale)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/60">{t("shipping")}</dt>
              <dd className="price font-semibold">
                {displayTotals.shipping === 0
                  ? t("shippingFree")
                  : formatCurrency(displayTotals.shipping, currency, locale)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>{t("total")}</dt>
              <dd className="price">{formatCurrency(displayTotals.total, currency, locale)}</dd>
            </div>
            {currency !== "IQD" && (
              <p className="pt-1 text-xs text-ink/60">
                {tCurrency("chargedAsIqd", { iqd: formatIQD(totals.total, locale) })}
              </p>
            )}
          </dl>
        </aside>

        {/* min-h guarantees enough room below the order summary for
            scrollIntoView(block:"start") to actually reach the top of
            the viewport — without it, short content (e.g. a one-item
            cart) hits the document's scroll limit first and the cards
            end up scrolled past, cut off above the fold instead of
            focused. */}
        <div className="mt-10 min-h-[75vh]">
          {region === null && (
            <div ref={regionCardsRef} className="scroll-mt-28">
              <h2 className="text-eyebrow mb-6 text-center text-ink/60">
                {t("chooseRegionTitle")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                <button
                  type="button"
                  onClick={() => setRegion("IQ")}
                  className="flex flex-col items-center justify-center gap-4 border border-line bg-white px-4 py-10 text-center transition-colors hover:border-ink sm:px-10 sm:py-36"
                >
                  <IraqMapIcon className="h-14 w-14 sm:h-24 sm:w-24" />
                  <span className="text-lg font-bold sm:text-3xl">{t("regionIraq")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegion("INTL")}
                  className="flex flex-col items-center justify-center gap-4 border border-line bg-white px-4 py-10 text-center transition-colors hover:border-ink sm:px-10 sm:py-36"
                >
                  <Globe size={96} className="h-14 w-14 sm:h-24 sm:w-24" aria-hidden="true" />
                  <span className="text-lg font-bold sm:text-3xl">{t("regionInternational")}</span>
                </button>
              </div>
            </div>
          )}

          {showMethodChoice && (
            <div ref={methodCardsRef} className="scroll-mt-28">
              <button
                type="button"
                onClick={() => setRegion(null)}
                className="mb-6 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
              >
                <CaretLeft size={14} aria-hidden="true" className="rtl:-scale-x-100" />
                {t("back")}
              </button>
              <h2 className="text-eyebrow mb-6 text-center text-ink/60">
                {t("chooseMethodTitle")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className="flex flex-col items-center justify-center gap-3 border border-line bg-white px-3 py-10 text-center transition-colors hover:border-ink sm:px-8 sm:py-28"
                >
                  <ShieldCheck size={80} className="h-12 w-12 sm:h-20 sm:w-20" aria-hidden="true" />
                  <span className="text-lg font-bold sm:text-2xl">{t("methodCard")}</span>
                  <span className="text-xs text-ink/60 sm:text-base">{t("methodCardDesc")}</span>
                </button>
                {hasPhysical && (
                  <button
                    type="button"
                    onClick={() => setMethod("cod")}
                    className="flex flex-col items-center justify-center gap-3 border border-line bg-white px-3 py-10 text-center transition-colors hover:border-ink sm:px-8 sm:py-28"
                  >
                    <Truck size={80} className="h-12 w-12 sm:h-20 sm:w-20" aria-hidden="true" />
                    <span className="text-lg font-bold sm:text-2xl">{t("methodCod")}</span>
                    <span className="text-xs text-ink/60 sm:text-base">{t("methodCodDesc")}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {showIntlShipping && (
            <div ref={intlShippingRef} className="scroll-mt-28">
              <button
                type="button"
                onClick={() => setRegion(null)}
                className="mb-6 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
              >
                <CaretLeft size={14} aria-hidden="true" className="rtl:-scale-x-100" />
                {t("back")}
              </button>
              <h2 className="text-eyebrow mb-6 text-ink/60">{t("chooseShippingTitle")}</h2>

              <div className="border border-line bg-white p-6 md:p-8">
                <label htmlFor="co-country" className="mb-2 block text-sm font-semibold">
                  {t("country")} *
                </label>
                {countries.length === 0 ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-danger">{t("errors.paymentInit")}</p>
                    <button
                      type="button"
                      onClick={() => router.refresh()}
                      className="btn btn-outline text-sm"
                    >
                      {t("tryAgain")}
                    </button>
                  </div>
                ) : (
                  <select
                    id="co-country"
                    value={destinationCountry ?? ""}
                    onChange={(e) => {
                      if (e.target.value) quoteShipping(e.target.value);
                      else {
                        setDestinationCountry(null);
                        setRateQuote(null);
                        setSelectedTier(null);
                      }
                    }}
                    className={`${inputClass(false)} cursor-pointer appearance-none`}
                  >
                    <option value="" disabled>
                      {t("selectCountry")}
                    </option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.countryName}>
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                )}

                {destinationCountry && (
                  <div className="mt-7 border-t border-line pt-6">
                    {quoteLoading && (
                      <p className="flex items-center gap-2 text-sm text-ink/60">
                        <CircleNotch size={16} aria-hidden="true" className="animate-spin" />
                        {t("calculatingShipping")}
                      </p>
                    )}

                    {!quoteLoading && quoteError && (
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm text-danger">{t("errors.paymentInit")}</p>
                        <button
                          type="button"
                          onClick={() => destinationCountry && quoteShipping(destinationCountry)}
                          className="btn btn-outline text-sm"
                        >
                          {t("tryAgain")}
                        </button>
                      </div>
                    )}

                    {!quoteLoading && !quoteError && rateQuote?.available === false && (
                      <div>
                        <p className="mb-3 text-sm text-ink/60">{t("standardShippingNote")}</p>
                        <div role="radiogroup" aria-label={t("chooseShippingTitle")}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={selectedTier === FALLBACK_SHIPPING_METHOD}
                            onClick={() => setSelectedTier(FALLBACK_SHIPPING_METHOD)}
                            className={`flex w-full flex-col items-center gap-1 border px-3 py-5 text-center transition-colors sm:w-1/4 ${
                              selectedTier === FALLBACK_SHIPPING_METHOD
                                ? "cursor-pointer border-ink bg-ink text-paper"
                                : "cursor-pointer border-line hover:border-ink"
                            }`}
                          >
                            <span className="font-bold">{t("standardShipping")}</span>
                            <span className="price mt-1.5 text-base font-semibold">
                              {formatCurrency(
                                convertFromIqd(SHIPPING_RATE_INTL, currency),
                                currency,
                                locale,
                              )}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {!quoteLoading && !quoteError && rateQuote?.available && (
                      <div
                        role="radiogroup"
                        aria-label={t("chooseShippingTitle")}
                        className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4"
                      >
                        {(() => {
                          const sortedTiers = [...rateQuote.tiers].sort((a, b) => a.priceUsd - b.priceUsd);
                          return sortedTiers.map((tier, i) => {
                            const active = selectedTier === tier.name;
                            const recommended = i === 0 && sortedTiers.length > 1;
                            const tierIqd = Math.round(tier.priceUsd * IQD_PER_USD);
                            return (
                              <button
                                key={tier.name}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => setSelectedTier(tier.name)}
                                className={`relative flex flex-col items-center gap-1 border px-3 pt-6 pb-5 text-center transition-colors ${
                                  active
                                    ? "cursor-pointer border-ink bg-ink text-paper"
                                    : "cursor-pointer border-line hover:border-ink"
                                }`}
                              >
                                {recommended && (
                                  <span
                                    className={`absolute inset-x-1.5 -top-2.5 px-1 py-0.5 text-[9px] leading-tight font-bold uppercase tracking-wide ${
                                      active ? "bg-paper text-ink" : "bg-ink text-paper"
                                    }`}
                                  >
                                    {t("recommendedBadge")}
                                  </span>
                                )}
                                <span className="font-bold">{tier.name}</span>
                                <span className="price mt-1.5 text-base font-semibold">
                                  {formatCurrency(convertFromIqd(tierIqd, currency), currency, locale)}
                                </span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-7 border-t border-line pt-6">
                  <button
                    type="button"
                    onClick={() => setIntlConfirmed(true)}
                    disabled={!selectedTier}
                    className="btn btn-ink w-full text-base"
                  >
                    {t("toPayment")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showWayl && (
            <div>
              <button
                type="button"
                onClick={backFromWayl}
                className="mb-6 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
              >
                <CaretLeft size={14} aria-hidden="true" className="rtl:-scale-x-100" />
                {requiresIntlShipping ? t("backToShipping") : t("back")}
              </button>
              <h2 className="text-eyebrow mb-6 text-ink/60">{t("payTitle")}</h2>

              <div className="border border-line bg-white p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-green text-white">
                    <ShieldCheck size={24} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold">{t("payBody")}</p>
                    <p className="mt-2 text-sm text-ink/60">{t("payMethods")}</p>
                  </div>
                </div>

                <div className="mt-7 border-t border-line pt-6">
                  <button
                    type="button"
                    onClick={payWayl}
                    disabled={busy}
                    className="btn btn-ink w-full text-base"
                  >
                    <LockSimple size={18} aria-hidden="true" />
                    {busy
                      ? t("paying")
                      : t("payNow", {
                          amount: formatCurrency(displayTotals.total, currency, locale),
                        })}
                  </button>
                  {currency !== "IQD" && (
                    <p className="mt-3 text-center text-xs text-ink/60">
                      {tCurrency("chargedAsIqd", { iqd: formatIQD(totals.total, locale) })}
                    </p>
                  )}
                  <p className="mt-3 text-center text-xs text-ink/60">{t("secureNote")}</p>
                  <div aria-live="assertive">
                    {submitError && (
                      <p className="mt-3 bg-danger/10 px-4 py-3 text-center text-sm font-semibold text-danger">
                        {submitError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showCod && (
            <form onSubmit={submitCod} noValidate>
              <button
                type="button"
                onClick={() => setMethod(null)}
                className="mb-6 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
              >
                <CaretLeft size={14} aria-hidden="true" className="rtl:-scale-x-100" />
                {t("back")}
              </button>

              <h2 className="text-eyebrow mb-6 text-ink/60">{t("contactTitle")}</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-firstName" className="mb-2 block text-sm font-semibold">
                    {t("firstName")} *
                  </label>
                  <input
                    id="co-firstName"
                    type="text"
                    autoComplete="given-name"
                    value={info.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    aria-invalid={Boolean(errors.firstName)}
                    className={inputClass(Boolean(errors.firstName))}
                  />
                  {errors.firstName && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="co-lastName" className="mb-2 block text-sm font-semibold">
                    {t("lastName")} *
                  </label>
                  <input
                    id="co-lastName"
                    type="text"
                    autoComplete="family-name"
                    value={info.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    aria-invalid={Boolean(errors.lastName)}
                    className={inputClass(Boolean(errors.lastName))}
                  />
                  {errors.lastName && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {errors.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="co-middleName" className="mb-2 block text-sm font-semibold">
                    {t("middleName")} *
                  </label>
                  <input
                    id="co-middleName"
                    type="text"
                    autoComplete="additional-name"
                    value={info.middleName}
                    onChange={(e) => setField("middleName", e.target.value)}
                    aria-invalid={Boolean(errors.middleName)}
                    className={inputClass(Boolean(errors.middleName))}
                  />
                  {errors.middleName && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {errors.middleName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="co-email" className="mb-2 block text-sm font-semibold">
                    {t("email")}{" "}
                    <span className="font-normal text-ink/60">({t("emailRecommended")})</span>
                  </label>
                  <input
                    id="co-email"
                    type="email"
                    autoComplete="email"
                    value={info.email}
                    onChange={(e) => setField("email", e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    className={inputClass(Boolean(errors.email))}
                  />
                  {errors.email && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-phoneNumber" className="mb-2 block text-sm font-semibold">
                    {t("phone")} *
                  </label>
                  <input
                    id="co-phoneNumber"
                    type="tel"
                    dir="ltr"
                    autoComplete="tel-national"
                    value={info.phoneNumber}
                    onChange={(e) => setField("phoneNumber", e.target.value)}
                    aria-invalid={Boolean(errors.phoneNumber)}
                    aria-describedby="co-phone-hint"
                    className={`${inputClass(Boolean(errors.phoneNumber))} text-start`}
                  />
                  <p id="co-phone-hint" className="mt-1.5 text-xs text-ink/60">
                    {t("phoneHint")}
                  </p>
                  {errors.phoneNumber && (
                    <p role="alert" className="mt-1 text-xs text-danger">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              <h2 className="text-eyebrow mb-6 mt-10 text-ink/60">{t("shippingTitle")}</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-governorate" className="mb-2 block text-sm font-semibold">
                    {t("governorate")} *
                  </label>
                  <select
                    id="co-governorate"
                    value={info.governorate}
                    onChange={(e) => setField("governorate", e.target.value)}
                    aria-invalid={Boolean(errors.governorate)}
                    className={`${inputClass(Boolean(errors.governorate))} cursor-pointer appearance-none`}
                  >
                    <option value="" disabled>
                      {t("selectGovernorate")}
                    </option>
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {tGov(g)}
                      </option>
                    ))}
                  </select>
                  {errors.governorate && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {errors.governorate}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="co-city" className="mb-2 block text-sm font-semibold">
                    {t("city")} *
                  </label>
                  <input
                    id="co-city"
                    type="text"
                    autoComplete="address-level2"
                    value={info.city}
                    onChange={(e) => setField("city", e.target.value)}
                    aria-invalid={Boolean(errors.city)}
                    className={inputClass(Boolean(errors.city))}
                  />
                  {errors.city && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {errors.city}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="co-landmark" className="mb-2 block text-sm font-semibold">
                    {t("landmark")} *
                  </label>
                  <input
                    id="co-landmark"
                    type="text"
                    placeholder={t("landmarkPlaceholder")}
                    value={info.landmark}
                    onChange={(e) => setField("landmark", e.target.value)}
                    aria-invalid={Boolean(errors.landmark)}
                    className={inputClass(Boolean(errors.landmark))}
                  />
                  {errors.landmark && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {errors.landmark}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <label htmlFor="co-notes" className="mb-2 block text-sm font-semibold">
                  {t("notes")}{" "}
                  <span className="font-normal text-ink/60">({t("optional")})</span>
                </label>
                <textarea
                  id="co-notes"
                  rows={3}
                  value={info.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  className="w-full border border-line bg-white p-4 text-base outline-none transition-colors focus:border-ink"
                />
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button type="submit" disabled={busy} className="btn btn-ink">
                  {busy ? t("paying") : t("codSubmit")}
                </button>
                <Link href="/shop" className="link-underline text-sm font-semibold text-ink/60">
                  {t("backToCart")}
                </Link>
              </div>
              <div aria-live="assertive">
                {submitError && (
                  <p className="mt-3 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                    {submitError}
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
