"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Ruler, X } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog/types";
import { useCart } from "@/lib/cart/store";
import { pick } from "@/lib/content";
import { formatCurrency, formatIQD } from "@/lib/money";
import { isValidEmailClient } from "@/lib/validate";
import { trackAddToCart, trackViewContent } from "@/lib/analytics/track";
import { trackVisitEvent } from "@/lib/analytics/track-visit";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { cmToIn } from "@/lib/measurements";
import type { SizeChartRow } from "@/lib/catalog/types";

const SIZE_CHART_FIELDS = ["chest", "length", "sleeve", "waist", "shoulder"] as const;
type SizeChartField = (typeof SIZE_CHART_FIELDS)[number];

/** Only columns at least one size actually has a value for — most
 * products won't use every measurement. */
function activeSizeChartFields(rows: SizeChartRow[]) {
  return SIZE_CHART_FIELDS.filter((f) => rows.some((r) => r[f] != null));
}

const SIZE_CHART_FIELD_KEYS: Record<SizeChartField, "sizeChartChest" | "sizeChartLength" | "sizeChartSleeve" | "sizeChartWaist" | "sizeChartShoulder"> = {
  chest: "sizeChartChest",
  length: "sizeChartLength",
  sleeve: "sizeChartSleeve",
  waist: "sizeChartWaist",
  shoulder: "sizeChartShoulder",
};

/** Unit toggle + measurement table — shared between the desktop inline
 * <details> and the mobile popup so the two surfaces can't drift apart. */
function SizeChartTable({
  sizeChart,
  chartUnit,
  setChartUnit,
}: {
  sizeChart: SizeChartRow[];
  chartUnit: "cm" | "in";
  setChartUnit: (u: "cm" | "in") => void;
}) {
  const t = useTranslations("product");
  const fields = activeSizeChartFields(sizeChart);
  return (
    <>
      <div className="mb-2 flex w-fit items-center gap-1 rounded-full border border-line p-0.5">
        {(["cm", "in"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setChartUnit(u)}
            className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              chartUnit === u ? "bg-ink text-paper" : "text-ink/50 hover:text-ink"
            }`}
          >
            {u === "cm" ? t("sizeChartCm") : t("sizeChartIn")}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line text-start">
              <th className="px-2 py-2 text-start font-semibold">{t("sizeChartSize")}</th>
              {fields.map((f) => (
                <th key={f} className="px-2 py-2 text-start font-semibold">
                  {t(SIZE_CHART_FIELD_KEYS[f])}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeChart.map((row) => (
              <tr key={row.size} className="border-b border-line/60 last:border-0">
                <td className="px-2 py-2 font-medium">{row.size}</td>
                {fields.map((f) => {
                  const cm = row[f];
                  return (
                    <td key={f} className="px-2 py-2 text-ink/70">
                      {cm == null ? "—" : chartUnit === "in" ? cmToIn(cm) : cm}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Buy box: size selection with live stock, quantity, add-to-cart. */
export default function AddToCart({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations("product");
  const tCurrency = useTranslations("currency");
  const tA11y = useTranslations("a11y");
  const { currency } = useCurrency();
  const addLine = useCart((s) => s.addLine);

  const inStockVariants = product.variants.filter((v) => v.stock > 0);
  const soldOut = inStockVariants.length === 0;

  const [size, setSize] = useState<string | undefined>(
    inStockVariants[0]?.size,
  );
  const [colorKey, setColorKey] = useState<string | undefined>(
    product.colors[0]?.key,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [chartUnit, setChartUnit] = useState<"cm" | "in">("cm");
  // Mobile-only: the same table shown inline (as a <details>) on desktop
  // opens as a popup instead on small screens, where an inline table
  // pushes the whole buy box down and forces awkward scrolling.
  const [chartModalOpen, setChartModalOpen] = useState(false);

  const selectedColor = product.colors.find((c) => c.key === colorKey);

  const variant = useMemo(
    () => product.variants.find((v) => v.size === size),
    [product.variants, size],
  );

  useEffect(() => {
    if (!chartModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setChartModalOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [chartModalOpen]);

  useEffect(() => {
    trackViewContent({
      slug: product.slug,
      title: pick(product.title, locale),
      price: product.price.amount,
    });
    trackVisitEvent("product_view", { productSlug: product.slug });
  }, [product.slug, product.title, product.price.amount, locale]);

  function onAdd() {
    if (!variant || variant.stock <= 0) return;
    addLine({
      productSlug: product.slug,
      variantId: variant.id,
      size: variant.size,
      colorKey: selectedColor?.key,
      colorName: selectedColor?.name,
      qty,
      unitAmount: product.price.amount,
      unitAmountByCurrency: product.priceByCurrency,
      title: product.title,
      image: product.images[0],
    });
    trackAddToCart({
      slug: product.slug,
      title: pick(product.title, locale),
      price: product.price.amount,
      qty,
    });
    trackVisitEvent("add_to_cart", { productSlug: product.slug });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      {/* Price */}
      {(() => {
        const amount = product.priceByCurrency[currency];
        const compareAt = product.compareAtPriceByCurrency?.[currency];
        const onSale = compareAt !== undefined && compareAt > amount;
        return (
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="price text-base font-semibold">
              {formatCurrency(amount, currency, locale)}
              {onSale && (
                <s className="ms-3 text-base font-normal text-ink/60">
                  {formatCurrency(compareAt, currency, locale)}
                </s>
              )}
            </p>
            {currency !== "IQD" && (
              <p className="text-sm text-ink/60">
                {tCurrency("chargedAsIqd", {
                  iqd: formatIQD(product.price.amount, locale),
                })}
              </p>
            )}
          </div>
        );
      })()}
      <p className="mt-1.5 text-xs text-ink/60">{t("taxNote")}</p>

      {/* Colour */}
      {product.colors.length > 0 && (
        <div className="mt-6">
          <p className="text-eyebrow mb-2.5 text-ink/55">
            {t("color")}
            {selectedColor && (
              <>
                {" "}—{" "}
                <span className="normal-case tracking-normal text-ink">
                  {pick(selectedColor.name, locale)}
                </span>
              </>
            )}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t("color")}
          >
            {product.colors.map((c) => {
              const active = c.key === colorKey;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={pick(c.name, locale)}
                  title={pick(c.name, locale)}
                  onClick={() => setColorKey(c.key)}
                  className={`h-6 w-6 cursor-pointer rounded-full border border-ink/20 transition-shadow ${
                    active
                      ? "ring-1 ring-ink ring-offset-2"
                      : "hover:ring-1 hover:ring-ink/40 hover:ring-offset-2"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Sizes */}
      {!product.giftCard && (
        <fieldset className="mt-6">
          <legend className="text-eyebrow mb-2.5 text-ink/55">{t("size")}</legend>
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
                  className={`relative flex h-9 min-w-10 items-center justify-center border px-2.5 text-xs font-semibold transition-colors ${
                    active
                      ? "cursor-pointer border-ink bg-ink text-paper"
                      : out
                        ? "cursor-not-allowed border-line text-ink opacity-40"
                        : "cursor-pointer border-line hover:border-ink"
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          {/* A boxed, icon-led CTA instead of a small text link — this was
              easy to miss entirely on most products (see git history: it
              used to be a text-xs/60%-opacity link). Only one box shows at
              a time: the inline per-product chart when there's real
              measurement data for it, otherwise the general size-guide
              page — never both competing for attention. On desktop the
              chart expands in place (a "mini table" is fine with the
              extra width); on phone the same box opens a popup instead,
              since an inline table there forces the whole buy box to
              scroll awkwardly. */}
          {product.sizeChart && activeSizeChartFields(product.sizeChart).length > 0 ? (
            <>
              <details className="group mt-4 hidden md:block">
                <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 bg-ink px-4 text-xs font-bold tracking-wide text-paper uppercase transition-colors hover:bg-ink/85">
                  <Ruler size={16} aria-hidden="true" />
                  {t("sizeChartTitle")}
                  <span
                    aria-hidden="true"
                    className="text-sm transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="mt-3">
                  <SizeChartTable
                    sizeChart={product.sizeChart}
                    chartUnit={chartUnit}
                    setChartUnit={setChartUnit}
                  />
                </div>
              </details>

              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setChartModalOpen(true)}
                className="mt-4 flex min-h-11 w-fit cursor-pointer items-center gap-2 bg-ink px-4 text-xs font-bold tracking-wide text-paper uppercase transition-colors hover:bg-ink/85 md:hidden"
              >
                <Ruler size={16} aria-hidden="true" />
                {t("sizeChartTitle")}
              </button>

              {chartModalOpen && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={t("sizeChartTitle")}
                  onClick={() => setChartModalOpen(false)}
                  className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 md:hidden"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative max-h-[80dvh] w-full overflow-y-auto bg-paper p-6 pb-8"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-display text-xl">{t("sizeChartTitle")}</h2>
                      <button
                        type="button"
                        aria-label={tA11y("closeMenu")}
                        onClick={() => setChartModalOpen(false)}
                        className="-me-2 flex h-10 w-10 cursor-pointer items-center justify-center transition-opacity hover:opacity-60"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <SizeChartTable
                      sizeChart={product.sizeChart}
                      chartUnit={chartUnit}
                      setChartUnit={setChartUnit}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/size-guide"
              className="mt-4 flex min-h-11 w-fit items-center gap-2 bg-ink px-4 text-xs font-bold tracking-wide text-paper uppercase transition-colors hover:bg-ink/85"
            >
              <Ruler size={16} aria-hidden="true" />
              {t("sizeGuide")}
            </Link>
          )}
        </fieldset>
      )}

      {/* Stock status */}
      <div aria-live="polite" className="mt-5 text-sm font-semibold">
        {soldOut ? (
          <span className="text-danger">{t("outOfStock")}</span>
        ) : variant && variant.stock <= 3 ? (
          <span className="text-ink">
            {t("lowStock", { count: variant.stock })}
          </span>
        ) : (
          <span className="text-ash">{t("inStock")}</span>
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
