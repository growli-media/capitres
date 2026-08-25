"use client";

import type { Currency } from "@/lib/catalog/types";
import { formatCurrency } from "@/lib/money";
import { useCurrency } from "@/components/currency/CurrencyProvider";

export default function Price({
  priceByCurrency,
  compareAtPriceByCurrency,
  locale,
  className = "",
}: {
  priceByCurrency: Record<Currency, number>;
  compareAtPriceByCurrency?: Partial<Record<Currency, number>>;
  locale: string;
  className?: string;
}) {
  const { currency } = useCurrency();
  const amount = priceByCurrency[currency];
  const compareAt = compareAtPriceByCurrency?.[currency];
  const onSale = compareAt !== undefined && compareAt > amount;
  return (
    <span className={`price inline-flex items-baseline gap-2 ${className}`}>
      <span className={onSale ? "font-semibold" : undefined}>
        {formatCurrency(amount, currency, locale)}
      </span>
      {onSale && (
        <s className="text-ink/60 text-[0.85em] no-underline line-through">
          {formatCurrency(compareAt, currency, locale)}
        </s>
      )}
    </span>
  );
}
