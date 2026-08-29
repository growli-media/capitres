"use client";

import { useState, useTransition } from "react";
import { Star } from "@phosphor-icons/react";
import ReviewRowActions from "./ReviewRowActions";
import { getReviewsForRangeAction } from "./actions";
import type { AdminReview } from "@/lib/admin/reviews";
import TimeRangeSlider from "../components/TimeRangeSlider";
import { DEFAULT_TIME_RANGE_VALUE, type TimeRangeValue } from "@/lib/admin/time-range";
import { glassCard, glassTone } from "../../glass";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} weight={i < rating ? "fill" : "regular"} />
      ))}
    </span>
  );
}

export default function ReviewsView({ initial }: { initial: AdminReview[] }) {
  const [range, setRange] = useState<TimeRangeValue>(DEFAULT_TIME_RANGE_VALUE);
  const [reviews, setReviews] = useState<AdminReview[]>(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: TimeRangeValue) {
    setRange(value);
    startTransition(async () => {
      setReviews(await getReviewsForRangeAction(value));
    });
  }

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <div>
      <TimeRangeSlider value={range} onChange={handleChange} pending={isPending} />
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {pending.length > 0
          ? `${pending.length} awaiting approval — nothing shows on the site until you approve it.`
          : "All caught up — nothing waiting for approval."}
      </p>

      {reviews.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No reviews in this range.</p>
        </div>
      ) : (
        <div className={`transition-opacity ${isPending ? "opacity-60" : ""}`}>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="mt-6 space-y-3 md:hidden">
            {[...pending, ...approved].map((r) => (
              <div key={r.id} className={`p-4 ${glassCard}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{r.productTitle}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{r.author}</p>
                  </div>
                  {r.approved ? (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>
                      Published
                    </span>
                  ) : (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.warning}`}>
                      Pending
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <Stars rating={r.rating} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{r.body}</p>
                <div className="mt-3">
                  <ReviewRowActions id={r.id} approved={r.approved} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className={`mt-6 hidden overflow-hidden md:block ${glassCard}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Product</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Author</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Rating</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Review</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...pending, ...approved].map((r) => (
                    <tr key={r.id}>
                      <td className="max-w-40 truncate px-4 py-3 font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                        {r.productTitle}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">{r.author}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Stars rating={r.rating} />
                      </td>
                      <td className="min-w-60 max-w-sm px-4 py-3 text-slate-600 dark:text-slate-400">
                        <p className="line-clamp-2">{r.body}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.approved ? (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.info}`}>
                            Published
                          </span>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.warning}`}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ReviewRowActions id={r.id} approved={r.approved} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
