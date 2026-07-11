"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog/types";
import { useCart } from "@/lib/cart/store";
import { pick } from "@/lib/content";
import { approxUsd, formatIQD } from "@/lib/money";
import { isValidEmailClient } from "@/lib/validate";

/** Buy box: size selection with live stock, quantity, add-to-cart. */
export default function AddToCart({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations("product");
  const tA11y = useTranslations("a11y");
  const addLine = useCart((s) => s.addLine);

  const inStockVariants = product.variants.filter((v) => v.stock > 0);
  const soldOut = inStockVariants.length === 0;

  const [size, setSize] = useState<string | undefined>(
    inStockVariants[0]?.size,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => product.variants.find((v) => v.size === size),
    [product.variants, size],
  );

  function onAdd() {
    if (!variant || variant.stock <= 0) return;
    addLine({
      productSlug: product.slug,
      variantId: variant.id,
      size: variant.size,
      qty,
      unitAmount: product.price.amount,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      {/* Price */}
      <div className="flex flex-wrap items-baseline gap-3">
        <p className="price text-2xl font-bold">
          {product.compareAtPrice ? (
            <span className="text-terracotta">
              {formatIQD(product.price.amount, locale)}
            </span>
          ) : (
            formatIQD(product.price.amount, locale)
          )}
          {product.compareAtPrice && (
            <s className="ms-3 text-base font-normal text-ink/60">
              {formatIQD(product.compareAtPrice.amount, locale)}
            </s>
          )}
        </p>
        <p className="text-sm text-ink/60">
          {t("approxUsd", { usd: approxUsd(product.price.amount) })}
        </p>
      </div>
      <p className="mt-1.5 text-xs text-ink/60">{t("taxNote")}</p>

      {/* Colour */}
      {product.colors.length > 0 && (
        <div className="mt-7">
          <p className="text-eyebrow mb-3 text-ink/60">
            {t("color")} —{" "}
            <span className="normal-case tracking-normal text-ink">
              {pick(product.colors[0].name, locale)}
            </span>
          </p>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <span
                key={c.key}
                title={pick(c.name, locale)}
                className="h-9 w-9 rounded-full border border-ink/20 ring-2 ring-ink ring-offset-2"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {!product.giftCard && (
        <fieldset className="mt-7">
          <legend className="text-eyebrow mb-3 text-ink/60">{t("size")}</legend>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t("size")}
          >
            {product.variants.map((v) => {
              const active = v.size === size;
              const out = v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={out}
                  onClick={() => setSize(v.size)}
                  className={`relative flex h-12 min-w-14 items-center justify-center border px-4 text-sm font-semibold transition-colors ${
                    active
                      ? "cursor-pointer border-ink bg-ink text-paper"
                      : out
                        ? "cursor-not-allowed border-line text-ink/30 line-through"
                        : "cursor-pointer border-line hover:border-ink"
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          <Link
            href="/size-guide"
            className="link-underline mt-3 inline-block text-xs font-semibold text-ink/60"
          >
            {t("sizeGuide")}
          </Link>
        </fieldset>
      )}

      {/* Stock status */}
      <div aria-live="polite" className="mt-5 text-sm font-semibold">
        {soldOut ? (
          <span className="text-danger">{t("outOfStock")}</span>
        ) : variant && variant.stock <= 3 ? (
          <span className="text-terracotta">
            {t("lowStock", { count: variant.stock })}
          </span>
        ) : (
          <span className="text-green">{t("inStock")}</span>
        )}
      </div>

      {/* Qty + CTA, or notify-me when sold out */}
      {soldOut ? (
        <NotifyMe productSlug={product.slug} />
      ) : (
        <div className="mt-5 flex gap-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label={tA11y("decreaseQty")}
              className="flex h-13 w-12 cursor-pointer items-center justify-center text-lg transition-colors hover:bg-studio"
            >
              −
            </button>
            <span className="price w-8 text-center font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(9, q + 1))}
              aria-label={tA11y("increaseQty")}
              className="flex h-13 w-12 cursor-pointer items-center justify-center text-lg transition-colors hover:bg-studio"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={!variant}
            className="btn btn-ink h-13 flex-1"
          >
            {added ? (
              <>
                <Check size={18} aria-hidden="true" />
                {t("added")}
              </>
            ) : (
              t("addToCart")
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function NotifyMe({ productSlug }: { productSlug: string }) {
  const t = useTranslations("product");
  const tNews = useTranslations("newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmailClient(email)) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productSlug, locale }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-5">
      <label
        htmlFor="notify-email"
        className="text-eyebrow mb-2 block text-ink/60"
      >
        {t("notifyMe")}
      </label>
      <div className="flex gap-2">
        <input
          id="notify-email"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder={t("notifyPlaceholder")}
          className="h-13 min-w-0 flex-1 border border-line bg-white px-4 text-sm outline-none transition-colors focus:border-ink"
        />
        <button
          type="submit"
          disabled={state === "sending" || state === "done"}
          className="btn btn-ink h-13"
        >
          {t("notifyMe")}
        </button>
      </div>
      <div aria-live="polite" className="mt-2 min-h-5 text-sm">
        {state === "done" && (
          <p className="font-semibold text-green">{t("notifySuccess")}</p>
        )}
        {state === "error" && (
          <p className="text-danger">{tNews("invalidEmail")}</p>
        )}
      </div>
    </form>
  );
}
