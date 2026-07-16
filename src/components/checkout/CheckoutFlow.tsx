"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CaretLeft, LockSimple, ShieldCheck } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import {
  useCart,
  useCartPromo,
  useCartTotals,
  type CartLine,
} from "@/lib/cart/store";
import { pick } from "@/lib/content";
import { formatIQD } from "@/lib/money";
import { isValidEmailClient, isValidIraqiPhone } from "@/lib/validate";
import { trackInitiateCheckout } from "@/lib/analytics/track";

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
  fullName: string;
  email: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof ShippingInfo, string>>;

function SummaryLine({ line, locale }: { line: CartLine; locale: string }) {
  const t = useTranslations("cart");
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
        {formatIQD(line.unitAmount * line.qty, locale)}
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

  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState<ShippingInfo>({
    fullName: "",
    email: "",
    phone: "",
    governorate: "",
    city: "",
    address: "",
    notes: "",
  });
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

  function setField<K extends keyof ShippingInfo>(k: K, v: string) {
    setInfo((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!info.fullName.trim()) next.fullName = t("errors.required");
    if (!isValidEmailClient(info.email)) next.email = t("errors.invalidEmail");
    if (!isValidIraqiPhone(info.phone)) next.phone = t("errors.invalidPhone");
    if (hasPhysical) {
      if (!info.governorate) next.governorate = t("errors.required");
      if (!info.city.trim()) next.city = t("errors.required");
      if (!info.address.trim()) next.address = t("errors.required");
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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          promoCode,
          customer: {
            fullName: info.fullName,
            email: info.email,
            phone: info.phone,
            governorate: info.governorate || undefined,
            city: info.city || undefined,
            address: info.address || undefined,
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
                <div className="sm:col-span-2">
                  <label
                    htmlFor="co-fullName"
                    className="mb-2 block text-sm font-semibold"
                  >
                    {t("fullName")} *
                  </label>
                  <input
                    id="co-fullName"
                    type="text"
                    autoComplete="name"
                    value={info.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    aria-invalid={Boolean(errors.fullName)}
                    className={inputClass(Boolean(errors.fullName))}
                  />
                  {errors.fullName && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="co-email"
                    className="mb-2 block text-sm font-semibold"
                  >
                    {t("email")} *
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
                <div>
                  <label
                    htmlFor="co-phone"
                    className="mb-2 block text-sm font-semibold"
                  >
                    {t("phone")} *
                  </label>
                  <input
                    id="co-phone"
                    type="tel"
                    dir="ltr"
                    autoComplete="tel"
                    value={info.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby="co-phone-hint"
                    className={`${inputClass(Boolean(errors.phone))} text-start`}
                  />
                  <p id="co-phone-hint" className="mt-1.5 text-xs text-ink/60">
                    {t("phoneHint")}
                  </p>
                  {errors.phone && (
                    <p role="alert" className="mt-1 text-xs text-danger">
                      {errors.phone}
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
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="co-address"
                        className="mb-2 block text-sm font-semibold"
                      >
                        {t("address")} *
                      </label>
                      <input
                        id="co-address"
                        type="text"
                        autoComplete="street-address"
                        value={info.address}
                        onChange={(e) => setField("address", e.target.value)}
                        aria-invalid={Boolean(errors.address)}
                        aria-describedby="co-address-hint"
                        className={inputClass(Boolean(errors.address))}
                      />
                      <p
                        id="co-address-hint"
                        className="mt-1.5 text-xs text-ink/60"
                      >
                        {t("addressHint")}
                      </p>
                      {errors.address && (
                        <p role="alert" className="mt-1 text-xs text-danger">
                          {errors.address}
                        </p>
                      )}
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
                          amount: formatIQD(totals.total, locale),
                        })}
                  </button>
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
                {formatIQD(totals.subtotal, locale)}
              </dd>
            </div>
            {totals.discount > 0 && promo && (
              <div className="flex justify-between text-green">
                <dt>
                  {t("discount")} ({promo.code})
                </dt>
                <dd className="price font-semibold">
                  −{formatIQD(totals.discount, locale)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/60">{t("shipping")}</dt>
              <dd className="price font-semibold">
                {totals.shipping === 0
                  ? t("shippingFree")
                  : formatIQD(totals.shipping, locale)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>{t("total")}</dt>
              <dd className="price">{formatIQD(totals.total, locale)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
