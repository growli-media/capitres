"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Plus } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog/types";
import { useCart } from "@/lib/cart/store";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { pick } from "@/lib/content";
import { formatCurrency } from "@/lib/money";

/** First in-stock variant — this widget adds its own default selection
 * per product, independent of whatever size/colour the customer may (or
 * may not) have picked in the main AddToCart buy box above it. Real
 * "frequently bought together" widgets (Amazon's included) work the same
 * way: their own self-contained default, not wired to the main buy box's
 * state. */
function defaultVariant(product: Product) {
  return product.variants.find((v) => v.stock > 0);
}

/**
 * Admin-curated cross-sell — only rendered when the current product has
 * at least one linked product (see relatedProductSlugs, set from the
 * "Frequently bought together" picker on the admin product form).
 * Thumbnail row with "+" separators, a checklist so the customer can
 * deselect an item before adding, and a running total — the same shape
 * as Amazon's own widget of the same name.
 */
export default function FrequentlyBoughtTogether({
  current,
  linked,
}: {
  current: Product;
  linked: Product[];
}) {
  const locale = useLocale();
  const t = useTranslations("product");
  const { currency } = useCurrency();
  const addLine = useCart((s) => s.addLine);

  const items = useMemo(() => [current, ...linked], [current, linked]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.filter((p) => defaultVariant(p)).map((p) => p.id)),
  );

  if (linked.length === 0) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedItems = items.filter((p) => selected.has(p.id));
  const total = selectedItems.reduce((sum, p) => sum + p.priceByCurrency[currency], 0);

  function handleAdd() {
    for (const p of selectedItems) {
      const variant = defaultVariant(p);
      if (!variant) continue;
      const color = p.colors[0];
      addLine({
        productSlug: p.slug,
        variantId: variant.id,
        size: variant.size,
        colorKey: color?.key,
        colorName: color?.name,
        qty: 1,
        unitAmount: p.price.amount,
        unitAmountByCurrency: p.priceByCurrency,
        title: p.title,
        image: p.images[0],
      });
    }
  }

  return (
    <div className="mt-9 border-t border-line pt-6">
      <p className="text-eyebrow text-ink/55">{t("frequentlyBoughtTogether")}</p>

      {/* Thumbnails with + separators */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
        {items.map((p, i) => (
          <div key={p.id} className="flex shrink-0 items-center gap-2">
            {i > 0 && (
              <Plus size={14} weight="bold" className="shrink-0 text-ink/35" aria-hidden="true" />
            )}
            <Link
              href={`/products/${p.slug}`}
              className="relative block h-16 w-16 shrink-0 overflow-hidden bg-paper"
            >
              <Image
                src={p.images[0].src}
                alt={pick(p.images[0].alt, locale)}
                fill
                sizes="64px"
                className="object-cover"
              />
            </Link>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <ul className="mt-4 space-y-2.5">
        {items.map((p) => {
          const variant = defaultVariant(p);
          return (
            <li key={p.id} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                disabled={!variant}
                className="h-4 w-4 shrink-0 cursor-pointer accent-ink disabled:cursor-not-allowed disabled:opacity-40"
              />
              <Link href={`/products/${p.slug}`} className="link-underline min-w-0 flex-1 truncate">
                {pick(p.title, locale)}
              </Link>
              <span className="price shrink-0 font-medium text-ink">
                {formatCurrency(p.priceByCurrency[currency], currency, locale)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
        <p className="price text-base font-semibold">
          {formatCurrency(total, currency, locale)}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          disabled={selectedItems.length === 0}
          className="btn btn-ink h-11 px-6 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("addSelectedToCart", { count: selectedItems.length })}
        </button>
      </div>
    </div>
  );
}
