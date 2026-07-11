"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, Trash, X } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import {
  useCart,
  useCartPromo,
  useCartTotals,
  type CartLine,
} from "@/lib/cart/store";
import { getProductBySlugSync } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { formatIQD } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/commerce/config";

function LineRow({ line }: { line: CartLine }) {
  const locale = useLocale();
  const t = useTranslations("cart");
  const tA11y = useTranslations("a11y");
  const { setQty, removeLine } = useCart();
  const product = getProductBySlugSync(line.productSlug);
  if (!product) return null;

  const title = pick(product.title, locale);
  const image = product.images[0];

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/products/${product.slug}`}
        className="relative block h-24 w-20 shrink-0 cursor-pointer overflow-hidden bg-studio"
      >
        <Image
          src={image.src}
          alt={pick(image.alt, locale)}
          fill
          sizes="80px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{title}</p>
            {line.giftCard ? (
              <p className="mt-0.5 text-xs text-ink/65">
                {t("giftCardFor", { email: line.giftCard.recipientEmail })}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-ink/65">{line.size}</p>
            )}
          </div>
          <p className="price shrink-0 text-sm font-semibold">
            {formatIQD(line.unitAmount * line.qty, locale)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          {line.giftCard ? (
            <span className="text-xs text-ink/65">
              {t("qty")} {line.qty}
            </span>
          ) : (
            <div className="flex items-center border border-line">
              <button
                type="button"
                onClick={() => setQty(line.key, line.qty - 1)}
                aria-label={tA11y("decreaseQty")}
                className="flex h-10 w-10 cursor-pointer items-center justify-center transition-colors hover:bg-studio"
              >
                <Minus size={14} />
              </button>
              <span className="price w-8 text-center text-sm font-semibold">
                {line.qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(line.key, line.qty + 1)}
                aria-label={tA11y("increaseQty")}
                className="flex h-10 w-10 cursor-pointer items-center justify-center transition-colors hover:bg-studio"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => removeLine(line.key)}
            aria-label={tA11y("removeItem", { item: title })}
            className="flex h-10 w-10 cursor-pointer items-center justify-center text-ink/60 transition-colors hover:text-danger"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

/** Slide-out cart. Uses logical `end` positioning so RTL mirrors. */
export default function CartDrawer() {
  const locale = useLocale();
  const t = useTranslations("cart");
  const tA11y = useTranslations("a11y");
  const { lines, isOpen, close, applyPromo, removePromo, promoCode } =
    useCart();
  const promo = useCartPromo();
  const totals = useCartTotals();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) closeRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const freeShipRemaining = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - (totals.subtotal - totals.discount),
  );
  const progress = Math.min(
    100,
    Math.round(
      ((totals.subtotal - totals.discount) / FREE_SHIPPING_THRESHOLD) * 100,
    ),
  );

  function submitPromo() {
    if (!promoInput.trim()) return;
    const ok = applyPromo(promoInput);
    setPromoError(!ok);
    if (ok) setPromoInput("");
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-ink/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className={`fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-300 ease-out ${
          isOpen
            ? "translate-x-0"
            : "translate-x-full rtl:-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-display text-xl">{t("title")}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={tA11y("closeCart")}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center transition-colors hover:text-green"
          >
            <X size={22} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-display text-2xl">{t("empty")}</p>
            <p className="text-sm text-ink/65">{t("emptySub")}</p>
            <Link
              href="/shop?new=1"
              onClick={close}
              className="btn btn-ink mt-6"
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            <div className="border-b border-line px-6 py-4">
              <p className="text-xs font-semibold">
                {totals.freeShipping
                  ? t("freeShipUnlocked")
                  : t("freeShipProgress", {
                      amount: formatIQD(freeShipRemaining, locale),
                    })}
              </p>
              <div
                className="mt-2 h-1 w-full bg-line"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-1 bg-green transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((line) => (
                <LineRow key={line.key} line={line} />
              ))}
            </ul>

            <div className="border-t border-line px-6 py-4">
              {/* Promo code */}
              {promo ? (
                <div className="mb-4 flex items-center justify-between bg-studio px-3 py-2.5">
                  <p className="text-xs font-semibold text-green">
                    {t("promoApplied", { code: promo.code })}
                  </p>
                  <button
                    type="button"
                    onClick={removePromo}
                    className="cursor-pointer text-xs font-semibold underline hover:text-danger"
                  >
                    {t("promoRemove")}
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <label
                    htmlFor="promo-input"
                    className="text-eyebrow mb-1.5 block text-ink/60"
                  >
                    {t("promoLabel")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo-input"
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setPromoError(false);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && submitPromo()}
                      placeholder={t("promoPlaceholder")}
                      className="h-11 min-w-0 flex-1 border border-line bg-white px-3 text-sm outline-none transition-colors focus:border-ink"
                    />
                    <button
                      type="button"
                      onClick={submitPromo}
                      className="btn btn-outline h-11 min-h-11 px-4 text-xs"
                    >
                      {t("promoApply")}
                    </button>
                  </div>
                  {promoError && (
                    <p role="alert" className="mt-1.5 text-xs text-danger">
                      {t("promoInvalid")}
                    </p>
                  )}
                </div>
              )}

              {totals.discount > 0 && (
                <div className="flex items-center justify-between py-1 text-sm">
                  <span className="text-ink/60">{t("discount")}</span>
                  <span className="price font-semibold text-green">
                    −{formatIQD(totals.discount, locale)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-bold">{t("subtotal")}</span>
                <span className="price text-base font-bold">
                  {formatIQD(totals.subtotal - totals.discount, locale)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/60">{t("shippingNote")}</p>

              <Link
                href="/checkout"
                onClick={close}
                className="btn btn-ink mt-4 w-full"
              >
                {t("checkout")}
              </Link>
              <button
                type="button"
                onClick={close}
                className="mt-3 flex w-full cursor-pointer justify-center text-sm font-semibold underline-offset-4 hover:underline"
              >
                {t("continueShopping")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
