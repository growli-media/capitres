import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog/types";
import { isInStock, isOnSale } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { BADGE_CLASSES } from "./badge-styles";
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
      <div className="relative aspect-[4/5] overflow-hidden bg-paper">
        <Image
          src={image.src}
          alt={pick(image.alt, locale)}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.05] group-hover:opacity-0"
        />
        {/* Editorial hover swap — reveals the second shot on hover; a
            single-image product simply keeps the slow zoom above. The
            first shot fades out as this one fades in (not just this one
            fading in on top) so a transparent-background product photo
            doesn't show both images layered at once mid-hover. */}
        {product.images[1] && (
          <Image
            src={product.images[1].src}
            alt=""
            aria-hidden="true"
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.05] group-hover:opacity-100"
          />
        )}
        {/* Smaller on mobile — at small card sizes (the homepage marquee,
            Shop All) full-size badges were covering most of the photo;
            text-[9px]/tighter padding shrink them there, sm: restores the
            original size once cards have room (shop grid, collections). */}
        <div className="absolute start-2 top-2 flex flex-col items-start gap-1 sm:start-3 sm:top-3 sm:gap-2">
          {product.isNew && (
            <span className={`text-eyebrow px-1.5 py-1 text-[9px] sm:px-2.5 sm:py-1.5 sm:text-[11px] ${BADGE_CLASSES.new}`}>
              {t("new")}
            </span>
          )}
          {!inStock && (
            <span className={`text-eyebrow px-1.5 py-1 text-[9px] sm:px-2.5 sm:py-1.5 sm:text-[11px] ${BADGE_CLASSES.soldOut}`}>
              {t("soldOut")}
            </span>
          )}
          {onSale && (
            <span className={`text-eyebrow px-1.5 py-1 text-[9px] sm:px-2.5 sm:py-1.5 sm:text-[11px] ${BADGE_CLASSES.sale}`}>
              {t("sale")}
            </span>
          )}
          {product.gender === "unisex" && (
            <span className={`text-eyebrow px-1.5 py-1 text-[9px] sm:px-2.5 sm:py-1.5 sm:text-[11px] ${BADGE_CLASSES.unisex}`}>
              {t("unisex")}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-start justify-between gap-4 pt-4">
        <h3 className="text-sm font-semibold leading-snug">
          <span className="link-underline">{pick(product.title, locale)}</span>
        </h3>
        <Price
          priceByCurrency={product.priceByCurrency}
          compareAtPriceByCurrency={product.compareAtPriceByCurrency}
          locale={locale}
          className="shrink-0 text-sm"
        />
      </div>
    </Link>
  );
}
