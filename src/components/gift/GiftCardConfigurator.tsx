"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "@phosphor-icons/react";
import { useCart } from "@/lib/cart/store";
import { GIFT_CARD_DENOMINATIONS } from "@/lib/commerce/config";
import { formatIQD } from "@/lib/money";
import { isValidEmailClient } from "@/lib/validate";
import { pick } from "@/lib/content";
import { trackAddToCart } from "@/lib/analytics/track";
import type { Product } from "@/lib/catalog/types";

/**
 * Gift card builder: denomination, recipient, personal message.
 * Each configuration becomes its own cart line (qty 1).
 */
export default function GiftCardConfigurator({
  product,
}: {
  product: Product;
}) {
  const t = useTranslations("giftCards");
  const tErr = useTranslations("checkout.errors");
  const tProduct = useTranslations("product");
  const locale = useLocale();
  const addLine = useCart((s) => s.addLine);

  const [denomination, setDenomination] = useState(
    GIFT_CARD_DENOMINATIONS[1],
  );
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [added, setAdded] = useState(false);

  function onAdd() {
    if (!isValidEmailClient(recipientEmail)) {
      setEmailError(true);
      return;
    }
    addLine({
      productSlug: product.slug,
      qty: 1,
      unitAmount: denomination,
      title: product.title,
      image: product.images[0],
      giftCard: {
        denomination,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        senderName: senderName.trim(),
        message: message.trim(),
      },
    });
    trackAddToCart({
      slug: product.slug,
      title: pick(product.title, locale),
      price: denomination,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-7">
      {/* Denominations */}
      <fieldset>
        <legend className="text-eyebrow mb-3 text-ink/60">{t("amount")}</legend>
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          role="radiogroup"
          aria-label={t("amount")}
        >
          {GIFT_CARD_DENOMINATIONS.map((d) => {
            const active = d === denomination;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setDenomination(d)}
                className={`price flex h-13 cursor-pointer items-center justify-center border px-3 text-sm font-bold transition-colors ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-ink"
                }`}
              >
                {formatIQD(d, locale)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Recipient / sender */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="gift-recipient-email"
            className="text-eyebrow mb-2 block text-ink/60"
          >
            {t("recipientEmail")} *
          </label>
          <input
            id="gift-recipient-email"
            type="email"
            required
            value={recipientEmail}
            onChange={(e) => {
              setRecipientEmail(e.target.value);
              setEmailError(false);
            }}
            className={`h-12 w-full border bg-white px-4 text-sm outline-none transition-colors focus:border-ink ${
              emailError ? "border-danger" : "border-line"
            }`}
          />
          {emailError && (
            <p role="alert" className="mt-1.5 text-xs text-danger">
              {tErr("invalidEmail")}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="gift-recipient-name"
            className="text-eyebrow mb-2 block text-ink/60"
          >
            {t("recipientName")}
          </label>
          <input
            id="gift-recipient-name"
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="h-12 w-full border border-line bg-white px-4 text-sm outline-none transition-colors focus:border-ink"
          />
        </div>
        <div>
          <label
            htmlFor="gift-sender-name"
            className="text-eyebrow mb-2 block text-ink/60"
          >
            {t("senderName")}
          </label>
          <input
            id="gift-sender-name"
            type="text"
            value={senderName}
            autoComplete="name"
            onChange={(e) => setSenderName(e.target.value)}
            className="h-12 w-full border border-line bg-white px-4 text-sm outline-none transition-colors focus:border-ink"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="gift-message"
          className="text-eyebrow mb-2 block text-ink/60"
        >
          {t("message")}
        </label>
        <textarea
          id="gift-message"
          rows={4}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          className="w-full border border-line bg-white p-4 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      <button type="button" onClick={onAdd} className="btn btn-ink w-full sm:w-auto">
        {added ? (
          <>
            <Check size={18} aria-hidden="true" />
            {tProduct("added")}
          </>
        ) : (
          t("addToCart")
        )}
      </button>

      <p className="text-xs text-ink/60">{t("termsNote")}</p>
    </div>
  );
}
