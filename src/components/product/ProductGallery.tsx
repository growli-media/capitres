"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { X } from "@phosphor-icons/react";
import type { ProductImage } from "@/lib/catalog/types";
import { imageSrcKey, pick } from "@/lib/content";

/**
 * PDP gallery, Saint-Laurent style. Desktop: every shot stacked vertically —
 * you simply scroll the images while the product info stays put (that column
 * is sticky in the parent). A live "1 / 4" counter tracks the shot in view.
 * Mobile: a swipeable snap carousel. Any image opens a full-screen zoom.
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
  const [active, setActive] = useState(0);
  const [zoomSrc, setZoomSrc] = useState<ProductImage["src"] | null>(null);
  const many = images.length > 1;
  const stackRef = useRef<HTMLDivElement>(null);

  // Desktop: report which stacked image is centred in the viewport.
  useEffect(() => {
    const root = stackRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-idx]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(Number((e.target as HTMLElement).dataset.idx));
          }
        }
      },
      { threshold: 0.55 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [images.length]);

  // Zoom lightbox: escape to close, lock body scroll.
  useEffect(() => {
    if (!zoomSrc) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomSrc(null);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoomSrc]);

  function onMobileScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  const zoomImg = zoomSrc
    ? images.find((i) => i.src === zoomSrc)
    : undefined;
  const zoomAlt = zoomImg ? pick(zoomImg.alt, locale) : "";

  return (
    <div>
      {/* Mobile: swipe carousel */}
      <div className="lg:hidden">
        <div
          onScroll={onMobileScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((img, i) => (
            <div
              key={imageSrcKey(img.src)}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-studio"
            >
              <Image
                src={img.src}
                alt={pick(img.alt, locale)}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
              {badge && i === 0 && (
                <span className="text-eyebrow absolute start-4 top-4 bg-ink px-2.5 py-1.5 text-paper">
                  {badge}
                </span>
              )}
            </div>
          ))}
        </div>
        {many && (
          <p className="text-eyebrow mt-3 text-ink/60">
            {active + 1} / {images.length}
          </p>
        )}
      </div>

      {/* Desktop: vertical stack you scroll, with a live counter */}
      <div ref={stackRef} className="relative hidden lg:block">
        {many && (
          <p className="text-eyebrow pointer-events-none sticky top-24 z-20 mb-3 w-fit bg-paper/70 px-2 py-1 text-ink/70 backdrop-blur">
            {active + 1} / {images.length}
          </p>
        )}
        <div className={many ? "-mt-9" : ""}>
          {images.map((img, i) => (
            <button
              key={imageSrcKey(img.src)}
              type="button"
              data-idx={i}
              onClick={() => setZoomSrc(img.src)}
              aria-label={t("zoomImage")}
              className="group relative block h-[100svh] w-full cursor-zoom-in overflow-hidden bg-studio"
            >
              <Image
                src={img.src}
                alt={pick(img.alt, locale)}
                fill
                priority={i === 0}
                sizes="50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              {badge && i === 0 && (
                <span className="text-eyebrow absolute start-4 top-4 z-10 bg-ink px-2.5 py-1.5 text-paper">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Zoom lightbox */}
      {zoomSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomAlt}
          className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-ink/95 p-4"
          onClick={() => setZoomSrc(null)}
        >
          <button
            type="button"
            aria-label={t("closeZoom")}
            onClick={() => setZoomSrc(null)}
            className="absolute end-4 top-4 z-10 flex h-12 w-12 cursor-pointer items-center justify-center bg-paper text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            <X size={20} />
          </button>
          <div className="relative h-full max-h-[92dvh] w-full max-w-5xl">
            <Image
              src={zoomSrc}
              alt={zoomAlt}
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
