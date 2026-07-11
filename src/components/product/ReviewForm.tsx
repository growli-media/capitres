"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "@phosphor-icons/react";

export default function ReviewForm({ productSlug }: { productSlug: string }) {
  const t = useTranslations("product");
  const tA11y = useTranslations("a11y");
  const tErr = useTranslations("checkout.errors");
  const locale = useLocale();

  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !text.trim()) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, author, rating, text, locale }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="bg-studio px-5 py-4 font-semibold text-green">
        {t("reviewThanks")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset>
        <legend className="text-eyebrow mb-2 text-ink/60">
          {t("reviewRating")}
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={tA11y("ratingInput", { n })}
              aria-pressed={rating >= n}
              onClick={() => setRating(n)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center transition-transform hover:scale-110"
            >
              <Star
                size={24}
                weight={rating >= n ? "fill" : "regular"}
                className={rating >= n ? "text-ink" : "text-ink/30"}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="review-name"
          className="text-eyebrow mb-2 block text-ink/60"
        >
          {t("reviewName")}
        </label>
        <input
          id="review-name"
          type="text"
          value={author}
          autoComplete="name"
          onChange={(e) => setAuthor(e.target.value)}
          className="h-12 w-full border border-line bg-white px-4 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      <div>
        <label
          htmlFor="review-text"
          className="text-eyebrow mb-2 block text-ink/60"
        >
          {t("reviewText")}
        </label>
        <textarea
          id="review-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border border-line bg-white p-4 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      <div aria-live="polite">
        {state === "error" && (
          <p className="mb-3 text-sm text-danger">{tErr("required")}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={state === "sending"}
        className="btn btn-outline"
      >
        {state === "sending" ? t("submittingReview") : t("submitReview")}
      </button>
    </form>
  );
}
