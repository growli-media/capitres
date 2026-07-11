import { formatIQD } from "@/lib/money";

export default function Price({
  amount,
  compareAt,
  locale,
  className = "",
}: {
  amount: number;
  compareAt?: number;
  locale: string;
  className?: string;
}) {
  const onSale = compareAt !== undefined && compareAt > amount;
  return (
    <span className={`price inline-flex items-baseline gap-2 ${className}`}>
      <span className={onSale ? "text-terracotta" : undefined}>
        {formatIQD(amount, locale)}
      </span>
      {onSale && (
        <s className="text-ink/60 text-[0.85em] no-underline line-through">
          {formatIQD(compareAt, locale)}
        </s>
      )}
    </span>
  );
}
