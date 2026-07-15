"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CaretLeft, CaretRight, MagnifyingGlassPlus, X } from "@phosphor-icons/react";
import type { ProductImage } from "@/lib/catalog/types";
import { imageSrcKey, pick } from "@/lib/content";

/**
 * PDP gallery: framed studio image, arrow/thumb navigation for multiple
 * shots, click-to-zoom lightbox (Escape or click to dismiss).
 */
export default function ProductGallery({
  images,
  badge,
}: {
  images: ProductImage[];
  badge?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("a11y");
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  const current = images[index];
  const many = images.length > 1;

  useEffect(() => {
    if (!zoom) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom]);

  return (
    <div>
      <div className="group relative aspect-[4/5] overflow-hidden bg-studio">
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label={t("zoomImage")}
          className="absolute inset-0 z-10 cursor-zoom-in"
        />
        <Image
          key={imageSrcKey(current.src)}
          src={current.src}
          alt={pick(current.alt, locale)}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {badge && (
          <span className="text-eyebrow absolute start-4 top-4 z-20 bg-ink px-2.5 py-1.5 text-paper">
            {badge}
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute bottom-4 end-4 z-20 flex h-10 w-10 items-center justify-center bg-paper/85 text-ink opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100"
        >
          <MagnifyingGlassPlus size={18} />
        </span>

        {many && (
          <>
            <button
              type="button"
              aria-label={t("prevImage")}
              onClick={() =>
                setIndex((i) => (i - 1 + images.length) % images.length)
              }
              className="absolute start-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center bg-paper/85 backdrop-blur transition-colors hover:bg-paper"
            >
              <CaretLeft size={18} className="rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              aria-label={t("nextImage")}
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="absolute end-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center bg-paper/85 backdrop-blur transition-colors hover:bg-paper"
            >
              <CaretRight size={18} className="rtl:-scale-x-100" />
            </button>
          </>
        )}
      </div>

      {many && (
        <ul className="mt-3 flex gap-3">
          {images.map((img, i) => (
            <li key={imageSrcKey(img.src)}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t("imageOf", { index: i + 1, total: images.length })}
                aria-current={i === index}
                className={`relative block h-20 w-16 cursor-pointer overflow-hidden bg-studio transition-opacity ${
                  i === index
                    ? "ring-2 ring-ink ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Zoom lightbox */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={pick(current.alt, locale)}
          className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-ink/95 p-4"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            aria-label={t("closeZoom")}
            onClick={() => setZoom(false)}
            className="absolute end-4 top-4 z-10 flex h-12 w-12 cursor-pointer items-center justify-center bg-paper text-ink transition-colors hover:bg-green hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="relative h-full max-h-[92dvh] w-full max-w-5xl">
            <Image
              src={current.src}
              alt={pick(current.alt, locale)}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
