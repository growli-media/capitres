"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowSquareOut, CaretDown, CaretLeft, CaretRight, CaretUp, ShoppingCartSimple } from "@phosphor-icons/react";
import type { VisitSummary, VisitEvent } from "@/lib/admin/analytics";
import { getVisitEventsAction } from "./actions";
import { glassCard, glassTone } from "../../glass";

const SOURCE_LABELS: Record<VisitSummary["referrerSource"], string> = {
  direct: "Direct",
  organic_search: "Search",
  social: "Social",
  referral: "Referral",
};
const SOURCE_TONES: Record<VisitSummary["referrerSource"], keyof typeof glassTone> = {
  direct: "neutral",
  organic_search: "info",
  social: "success",
  referral: "warning",
};
const EVENT_LABELS: Record<VisitEvent["type"], string> = {
  page_view: "Viewed",
  product_view: "Viewed product",
  add_to_cart: "Added to cart",
};

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function locationLabel(v: VisitSummary): string {
  const parts = [v.city, v.region, v.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown location";
}

/** Recent-visits list — each row expands in place into a chronological
 * activity log (lazily fetched once, cached in local state). Selecting a
 * visit here is what the map (once built) will highlight against — see
 * AnalyticsView.tsx, which owns selectedVisitId and passes it down. */
export default function RecentVisits({
  visits,
  selectedVisitId,
  onSelectVisit,
  page,
  totalPages,
  onPageChange,
}: {
  visits: VisitSummary[];
  selectedVisitId: string | null;
  onSelectVisit: (id: string | null) => void;
  /** 1-based — the whole list re-fetches per page (AnalyticsView.tsx),
   * there's no client-side slicing here. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [eventsByVisit, setEventsByVisit] = useState<Record<string, VisitEvent[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(visit: VisitSummary) {
    const next = selectedVisitId === visit.id ? null : visit.id;
    onSelectVisit(next);
    if (next && !eventsByVisit[visit.id]) {
      setLoadingId(visit.id);
      startTransition(async () => {
        const rows = await getVisitEventsAction(visit.id);
        setEventsByVisit((prev) => ({ ...prev, [visit.id]: rows }));
        setLoadingId(null);
      });
    }
  }

  if (visits.length === 0) {
    return (
      <div className={`p-8 text-center text-sm text-slate-500 dark:text-slate-400 ${glassCard}`}>
        No visits tracked yet.
      </div>
    );
  }

  return (
    <div className={`divide-y divide-slate-200/70 overflow-hidden dark:divide-slate-800/70 ${glassCard}`}>
      {visits.map((visit) => {
        const expanded = selectedVisitId === visit.id;
        const visitEvents = eventsByVisit[visit.id];
        return (
          <div key={visit.id}>
            <button
              type="button"
              onClick={() => toggle(visit)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-start transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {locationLabel(visit)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${glassTone[SOURCE_TONES[visit.referrerSource]]}`}
                  >
                    {SOURCE_LABELS[visit.referrerSource]}
                    {visit.referrerHost ? ` · ${visit.referrerHost}` : ""}
                  </span>
                  {visit.convertedOrderRef && (
                    <Link
                      href={`/admin/orders/${visit.convertedOrderRef}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${glassTone.success}`}
                    >
                      <ShoppingCartSimple size={11} aria-hidden="true" />
                      {visit.convertedOrderRef}
                    </Link>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {formatRelative(visit.lastSeen)} · {visit.eventCount} event{visit.eventCount === 1 ? "" : "s"} ·
                  landed on {visit.landingPath}
                </p>
              </div>
              {expanded ? (
                <CaretUp size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
              ) : (
                <CaretDown size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
              )}
            </button>
            {expanded && (
              <div className="border-t border-slate-200/70 bg-slate-50/50 px-5 py-4 dark:border-slate-800/70 dark:bg-slate-900/30">
                <Link
                  href={`/admin/analytics/visits/${visit.id}`}
                  className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  View full detail
                  <ArrowSquareOut size={12} aria-hidden="true" />
                </Link>
                {loadingId === visit.id ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
                ) : !visitEvents || visitEvents.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">No activity recorded.</p>
                ) : (
                  <ol className="space-y-2">
                    {visitEvents.map((event) => (
                      <li key={event.id} className="flex items-baseline gap-3 text-sm">
                        <span className="w-14 shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
                          {formatTime(event.occurredAt)}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {EVENT_LABELS[event.type]}
                          {event.productSlug && (
                            <span className="ms-1 font-medium text-slate-900 dark:text-slate-100">
                              {event.productSlug}
                            </span>
                          )}
                          {!event.productSlug && event.path && (
                            <span className="ms-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                              {event.path}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Newer visits"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <CaretLeft size={14} aria-hidden="true" />
          </button>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Older visits"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <CaretRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
