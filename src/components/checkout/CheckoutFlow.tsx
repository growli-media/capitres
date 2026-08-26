"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CaretLeft, LockSimple, ShieldCheck } from "@phosphor-icons/react";
import { parsePhoneNumber, type CountryCode } from "libphonenumber-js/min";
import { Link } from "@/i18n/navigation";
import {
  useCart,
  useCartPromo,
  useCartTotals,
  useCartTotalsByCurrency,
  type CartLine,
} from "@/lib/cart/store";
import { pick } from "@/lib/content";
import { formatCurrency, formatIQD } from "@/lib/money";
import { isValidEmailClient, isValidPhone } from "@/lib/validate";
import { sortedCountries } from "@/lib/countries";
import { trackInitiateCheckout } from "@/lib/analytics/track";
import { useCurrency } from "@/components/currency/CurrencyProvider";

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

interface ShippingInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  /** Dial-code country for the phone — independent of the shipping
   * country (a customer can ship to one country, carry a phone from
   * another). Defaults to match `country` and stays in sync until the
   * customer touches it directly. */
  phoneCountry: CountryCode;
  phoneNumber: string;
  country: CountryCode;
  street: string;
  streetNumber: string;
  zip: string;
  city: string;
  state: string;
  /** Only meaningful (shown + required) when country === "IQ". */
  governorate: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof ShippingInfo, string>>;

function SummaryLine({ line, locale }: { line: CartLine; locale: string }) {
  const t = useTranslations("cart");
  const { currency } = useCurrency();
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="relative h-16 w-13 shrink-0 overflow-hidden bg-studio">
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

export default function CheckoutFlow() {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tGov = useTranslations("governorates");
  const { lines, promoCode, hasHydrated } = useCart();
  const promo = useCartPromo();
  const totals = useCartTotals();
  const { currency } = useCurrency();
  const tCurrency = useTranslations("currency");
  const displayTotals = useCartTotalsByCurrency(currency);
  const countries = useMemo(() => sortedCountries(locale), [locale]);

  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState<ShippingInfo>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneCountry: "IQ",
    phoneNumber: "",
    country: "IQ",
    street: "",
    streetNumber: "",
    zip: "",
    city: "",
    state: "",
    governorate: "",
    notes: "",
  });
  const [phoneCountryTouched, setPhoneCountryTouched] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const hasPhysical = lines.some((l) => !l.giftCard);

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

  function setField<K extends keyof ShippingInfo>(k: K, v: ShippingInfo[K]) {
    setInfo((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  function setCountry(country: CountryCode) {
    setField("country", country);
    // Phone dial-code follows the shipping country by default — most
    // orders are for the customer's own phone — but stops following the
    // moment the customer picks a dial code themselves.
    if (!phoneCountryTouched) setField("phoneCountry", country);
    if (country !== "IQ") setField("governorate", "");
  }

  function setPhoneCountry(country: CountryCode) {
    setPhoneCountryTouched(true);
    setField("phoneCountry", country);
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!info.firstName.trim()) next.firstName = t("errors.required");
    if (!info.middleName.trim()) next.middleName = t("errors.required");
    if (!info.lastName.trim()) next.lastName = t("errors.required");
    if (info.email.trim() && !isValidEmailClient(info.email)) {
      next.email = t("errors.invalidEmail");
    }
    if (!isValidPhone(info.phoneNumber, info.phoneCountry)) {
      next.phoneNumber = t("errors.invalidPhone");
    }
    if (hasPhysical) {
      if (info.country === "IQ" && !info.governorate) {
        next.governorate = t("errors.required");
      }
      if (!info.street.trim()) next.street = t("errors.required");
      if (!info.streetNumber.trim()) next.streetNumber = t("errors.required");
      if (!info.city.trim()) next.city = t("errors.required");
    }
    setErrors(next);
    const firstError = Object.entries(next).find(([, v]) => v);
    if (firstError) {
      document.getElementById(`co-${firstError[0]}`)?.focus();
      return false;
    }
    return true;
  }

  function toPayment(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function pay() {
    setPaying(true);
    setPayError(null);
    try {
      let phoneE164 = info.phoneNumber;
      try {
        phoneE164 = parsePhoneNumber(info.phoneNumber, info.phoneCountry).format("E.164");
      } catch {
        // validate() already ran before step 2 was reachable, so this
        // shouldn't happen — the server re-validates regardless.
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          promoCode,
          customer: {
            firstName: info.firstName,
            middleName: info.middleName,
            lastName: info.lastName,
            email: info.email.trim() || undefined,
            phone: phoneE164,
            country: info.country,
            street: info.street || undefined,
            streetNumber: info.streetNumber || undefined,
            zip: info.zip || undefined,
            city: info.city || undefined,
            state: info.state || undefined,
            governorate:
              info.country === "IQ" ? info.governorate || undefined : undefined,
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
        setPayError(t("errors.paymentInit"));
        setPaying(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setPayError(t("errors.paymentInit"));
      setPaying(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `h-12 w-full border bg-white px-4 text-base outline-none transition-colors focus:border-ink ${
      hasError ? "border-danger" : "border-line"
    }`;

  const steps = [t("stepShipping"), t("stepPayment"), t("stepConfirm")];
  const currentStep = step;

  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="text-display text-4xl md:text-6xl">{t("title")}</h1>

      {/* Step indicator */}
      <ol
        aria-label={t("stepLabel", { current: currentStep, total: 3 })}
        className="mt-8 flex flex-wrap items-center gap-2 text-sm"
      >
        {steps.map((label, i) => {
          const n = i + 1;
          const state =
            n < currentStep ? "done" : n === currentStep ? "current" : "next";
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={`flex items-center gap-2 px-3 py-2 font-semibold ${
                  state === "current"
                    ? "bg-ink text-paper"
                    : state === "done"
                      ? "bg-green text-white"
                      : "bg-studio text-ink/60"
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

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
        {/* Main column */}
        <div>
          {step === 1 && (
            <form onSubmit={toPayment} noValidate>
              <h2 className="text-eyebrow mb-6 text-ink/60">
                {t("contactTitle")}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="co-firstName"
                    className="mb-2 block text-sm font-semibold"
                  >
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
                  <label
                    htmlFor="co-lastName"
                    className="mb-2 block text-sm font-semibold"
                  >
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
                  <label
                    htmlFor="co-middleName"
                    className="mb-2 block text-sm font-semibold"
                  >
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
                  <label
                    htmlFor="co-email"
                    className="mb-2 block text-sm font-semibold"
                  >
                    {t("email")}{" "}
                    <span className="font-normal text-ink/60">
                      ({t("emailRecommended")})
                    </span>
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
                  <label
                    htmlFor="co-phoneNumber"
                    className="mb-2 block text-sm font-semibold"
                  >
                    {t("phone")} *
                  </label>
                  <div className="flex gap-2" dir="ltr">
                    <select
                      id="co-phoneCountry"
                      aria-label={t("phoneCountry")}
                      value={info.phoneCountry}
                      onChange={(e) =>
                        setPhoneCountry(e.target.value as CountryCode)
                      }
                      className={`${inputClass(false)} shrink-0 cursor-pointer appearance-none px-2`}
                      style={{ width: "13.2rem" }}
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          +{c.dialCode} {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      id="co-phoneNumber"
                      type="tel"
                      autoComplete="tel-national"
                      value={info.phoneNumber}
                      onChange={(e) => setField("phoneNumber", e.target.value)}
                      aria-invalid={Boolean(errors.phoneNumber)}
                      aria-describedby={
                        info.phoneCountry === "IQ" ? "co-phone-hint" : undefined
                      }
                      className={`${inputClass(Boolean(errors.phoneNumber))} min-w-0 flex-1 text-start`}
                    />
                  </div>
                  {info.phoneCountry === "IQ" && (
                    <p id="co-phone-hint" className="mt-1.5 text-xs text-ink/60">
                      {t("phoneHint")}
                    </p>
                  )}
                  {errors.phoneNumber && (
                    <p role="alert" className="mt-1 text-xs text-danger">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {hasPhysical && (
                <>
                  <h2 className="text-eyebrow mb-6 mt-10 text-ink/60">
                    {t("shippingTitle")}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="co-country"
                        className="mb-2 block text-sm font-semibold"
                      >
                        {t("country")} *
                      </label>
                      <select
                        id="co-country"
                        value={info.country}
                        onChange={(e) => setCountry(e.target.value as CountryCode)}
                        className={`${inputClass(false)} cursor-pointer appearance-none`}
                      >
                        {countries.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {info.country === "IQ" ? (
                      <div>
                        <label
                          htmlFor="co-governorate"
                          className="mb-2 block text-sm font-semibold"
                        >
                          {t("governorate")} *
                        </label>
                        <select
                          id="co-governorate"
                          value={info.governorate}
                          onChange={(e) =>
                            setField("governorate", e.target.value)
                          }
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
                    ) : (
                      <div>
                        <label
                          htmlFor="co-state"
                          className="mb-2 block text-sm font-semibold"
                        >
                          {t("state")}{" "}
                          <span className="font-normal text-ink/60">
                            ({t("optional")})
                          </span>
                        </label>
                        <input
                          id="co-state"
                          type="text"
                          autoComplete="address-level1"
                          value={info.state}
                          onChange={(e) => setField("state", e.target.value)}
                          className={inputClass(false)}
                        />
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor="co-city"
                        className="mb-2 block text-sm font-semibold"
                      >
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
                      <label
                        htmlFor="co-street"
                        className="mb-2 block text-sm font-semibold"
                      >
                        {t("street")} *
                      </label>
                      <input
                        id="co-street"
                        type="text"
                        autoComplete="address-line1"
                        value={info.street}
                        onChange={(e) => setField("street", e.target.value)}
                        aria-invalid={Boolean(errors.street)}
                        className={inputClass(Boolean(errors.street))}
                      />
                      {errors.street && (
                        <p role="alert" className="mt-1.5 text-xs text-danger">
                          {errors.street}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="co-streetNumber"
                        className="mb-2 block text-sm font-semibold"
                      >
                        {t("streetNumber")} *
                      </label>
                      <input
                        id="co-streetNumber"
                        type="text"
                        autoComplete="address-line2"
                        value={info.streetNumber}
                        onChange={(e) => setField("streetNumber", e.target.value)}
                        aria-invalid={Boolean(errors.streetNumber)}
                        className={inputClass(Boolean(errors.streetNumber))}
                      />
                      {errors.streetNumber && (
                        <p role="alert" className="mt-1.5 text-xs text-danger">
                          {errors.streetNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="co-zip"
                        className="mb-2 block text-sm font-semibold"
                      >
                        {t("zip")}{" "}
                        <span className="font-normal text-ink/60">
                          ({t("optional")})
                        </span>
                      </label>
                      <input
                        id="co-zip"
                        type="text"
                        autoComplete="postal-code"
                        value={info.zip}
                        onChange={(e) => setField("zip", e.target.value)}
                        className={inputClass(false)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="mt-8">
                <label
                  htmlFor="co-notes"
                  className="mb-2 block text-sm font-semibold"
                >
                  {t("notes")}{" "}
                  <span className="font-normal text-ink/60">
                    ({t("optional")})
                  </span>
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
                <button type="submit" className="btn btn-ink">
                  {t("toPayment")}
                </button>
                <Link
                  href="/shop"
                  className="link-underline text-sm font-semibold text-ink/60"
                >
                  {t("backToCart")}
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-eyebrow mb-6 text-ink/60">{t("payTitle")}</h2>

              <div className="border border-line bg-white p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-green text-white">
                    <ShieldCheck size={24} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold">{t("payBody")}</p>
                    <p className="mt-2 text-sm text-ink/60">
                      {t("payMethods")}
                    </p>
                  </div>
                </div>

                <div className="mt-7 border-t border-line pt-6">
                  <button
                    type="button"
                    onClick={pay}
                    disabled={paying}
                    className="btn btn-ink w-full text-base"
                  >
                    <LockSimple size={18} aria-hidden="true" />
                    {paying
                      ? t("paying")
                      : t("payNow", {
                          amount: formatCurrency(displayTotals.total, currency, locale),
                        })}
                  </button>
                  {currency !== "IQD" && (
                    <p className="mt-3 text-center text-xs text-ink/60">
                      {tCurrency("chargedAsIqd", {
                        iqd: formatIQD(totals.total, locale),
                      })}
                    </p>
                  )}
                  <p className="mt-3 text-center text-xs text-ink/60">
                    {t("secureNote")}
                  </p>
                  <div aria-live="assertive">
                    {payError && (
                      <p className="mt-3 bg-danger/10 px-4 py-3 text-center text-sm font-semibold text-danger">
                        {payError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-6 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
              >
                <CaretLeft
                  size={14}
                  aria-hidden="true"
                  className="rtl:-scale-x-100"
                />
                {t("backToShipping")}
              </button>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <aside
          aria-label={t("orderSummary")}
          className="h-fit border border-line bg-white p-6 lg:sticky lg:top-24"
        >
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
            {displayTotals.discount > 0 && promo && (
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
              <dd className="price">
                {formatCurrency(displayTotals.total, currency, locale)}
              </dd>
            </div>
            {currency !== "IQD" && (
              <p className="pt-1 text-xs text-ink/60">
                {tCurrency("chargedAsIqd", { iqd: formatIQD(totals.total, locale) })}
              </p>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}
