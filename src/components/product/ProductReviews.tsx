"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star, X } from "@phosphor-icons/react";
import { localizeDigits } from "@/lib/money";
import ReviewForm from "./ReviewForm";

type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
};

/**
 * Compact review affordance for the product info panel: just the five stars
 * (average) plus the count. Clicking opens a popup with any existing reviews
 * and the write-a-review form (pick a rating, add name + text, submit).
 */
export default function ProductReviews({
  productSlug,
  reviews,
  avgRating,
}: {
  productSlug: string;
  reviews: Review[];
  avgRating: number | null;
}) {
  const t = useTranslations("product");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="group inline-flex cursor-pointer items-center gap-2"
      >
        <span
          role="img"
          aria-label={
            avgRating !== null
              ? t("stars", { count: localizeDigits(avgRating, locale) })
              : t("writeReview")
          }
          className="flex items-center gap-0.5"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={15}
              weight={
                avgRating !== null && avgRating >= n - 0.25 ? "fill" : "regular"
              }
              className="text-ink"
              aria-hidden="true"
            />
          ))}
        </span>
        <span className="text-eyebrow text-ink/55 transition-colors group-hover:text-ink">
          {t("reviewsCount", { count: reviews.length })}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("reviews")}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto bg-paper p-8 md:p-10"
          >
            <button
              type="button"
              aria-label={tA11y("closeMenu")}
              onClick={() => setOpen(false)}
              className="absolute end-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center transition-opacity hover:opacity-60"
            >
              <X size={20} />
            </button>

            <h2 className="text-display text-2xl">{t("reviews")}</h2>
            <p className="text-eyebrow mt-2 text-ink/55">
              {t("reviewsCount", { count: reviews.length })}
            </p>

            {reviews.length > 0 && (
              <ul className="mt-6 space-y-5 border-b border-line pb-6">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold">{r.author}</p>
                      <span
                        role="img"
                        aria-label={t("stars", {
                          count: localizeDigits(r.rating, locale),
                        })}
                        className="flex gap-0.5"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={12}
                            weight={r.rating >= n ? "fill" : "regular"}
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink/55">
                      {localizeDigits(r.date, locale)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/75">
                      {r.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6">
              <h3 className="text-eyebrow mb-4 text-ink/60">
                {t("writeReview")}
              </h3>
              <ReviewForm productSlug={productSlug} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
