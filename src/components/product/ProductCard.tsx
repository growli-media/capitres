import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog/types";
import { isInStock, isOnSale } from "@/lib/catalog";
import { pick } from "@/lib/content";
import Price from "./Price";

/**
 * Editorial product card — studio-toned canvas, slow zoom on hover,
 * badges for new/sale/sold-out. Works in RSC and client trees.
 */
export default function ProductCard({
  product,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  product: Product;
  sizes?: string;
  priority?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("badges");
  const inStock = isInStock(product);
  const onSale = isOnSale(product);
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block cursor-pointer"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-studio">
        <Image
          src={image.src}
          alt={pick(image.alt, locale)}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute start-3 top-3 flex flex-col items-start gap-2">
          {product.isNew && (
            <span className="text-eyebrow bg-ink px-2.5 py-1.5 text-paper">
              {t("new")}
            </span>
          )}
          {onSale && (
            <span className="text-eyebrow bg-terracotta px-2.5 py-1.5 text-white">
              {t("sale")}
            </span>
          )}
        </div>
        {!inStock && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/85 py-2.5 text-center">
            <span className="text-eyebrow text-paper">{t("soldOut")}</span>
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 pt-4">
        <h3 className="text-sm font-semibold leading-snug">
          <span className="link-underline">{pick(product.title, locale)}</span>
        </h3>
        <Price
          amount={product.price.amount}
          compareAt={product.compareAtPrice?.amount}
          locale={locale}
          className="shrink-0 text-sm"
        />
      </div>
    </Link>
  );
}
