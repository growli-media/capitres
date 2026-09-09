import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft, ShoppingCartSimple } from "@phosphor-icons/react/dist/ssr";
import { getVisit, getVisitEvents, type VisitEvent } from "@/lib/admin/analytics";
import { requirePermission } from "@/lib/admin/permissions";
import { glassCard, glassTone } from "../../../../glass";

export const metadata: Metadata = { title: "Visit" };

const SOURCE_LABELS = {
  direct: "Direct",
  organic_search: "Organic search",
  social: "Social",
  referral: "Referral",
} as const;

const EVENT_LABELS: Record<VisitEvent["type"], string> = {
  page_view: "Viewed",
  product_view: "Viewed product",
  add_to_cart: "Added to cart",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function locationLabel(v: { city: string | null; region: string | null; country: string | null }): string {
  const parts = [v.city, v.region, v.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown location";
}

/** Time spent on each step is the gap to the next event — the last
 * event in the list has nothing to measure against, so it's left open
 * ("still browsing" rather than a fabricated 0s). */
function withDwellTime(events: VisitEvent[]): { event: VisitEvent; dwellMs: number | null }[] {
  return events.map((event, i) => {
    const next = events[i + 1];
    const dwellMs = next ? new Date(next.occurredAt).getTime() - new Date(event.occurredAt).getTime() : null;
    return { event, dwellMs };
  });
}

function formatDwell(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("analytics");
  const { id } = await params;
  const visit = await getVisit(id);
  if (!visit) notFound();

  const events = await getVisitEvents(id);
  const timeline = withDwellTime(events);

  return (
    <div>
      <Link
        href="/admin/analytics"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <CaretLeft size={14} aria-hidden="true" />
        Analytics
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {locationLabel(visit)}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            First seen {formatDateTime(visit.firstSeen)} · last seen {formatDateTime(visit.lastSeen)}
          </p>
        </div>
        {visit.convertedOrderRef && (
          <Link
            href={`/admin/orders/${visit.convertedOrderRef}`}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${glassTone.success}`}
          >
            <ShoppingCartSimple size={14} aria-hidden="true" />
            Converted → {visit.convertedOrderRef}
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className={`overflow-hidden ${glassCard}`}>
            <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
            </div>
            {timeline.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400 dark:text-slate-500">No activity recorded.</p>
            ) : (
              <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                {timeline.map(({ event, dwellMs }) => (
                  <li key={event.id} className="flex items-baseline gap-4 px-5 py-3 text-sm">
                    <span className="w-16 shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
                      {new Date(event.occurredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex-1 text-slate-700 dark:text-slate-300">
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
                    {dwellMs !== null && (
                      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                        {formatDwell(dwellMs)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`p-5 ${glassCard}`}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">How they arrived</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">Source</dt>
                <dd className="text-end text-slate-700 dark:text-slate-300">
                  {SOURCE_LABELS[visit.referrerSource]}
                </dd>
              </div>
              {visit.referrerHost && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-slate-400 dark:text-slate-500">Referrer</dt>
                  <dd className="text-end text-slate-700 dark:text-slate-300">{visit.referrerHost}</dd>
                </div>
              )}
              {visit.utmSource && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-slate-400 dark:text-slate-500">UTM source</dt>
                  <dd className="text-end text-slate-700 dark:text-slate-300">{visit.utmSource}</dd>
                </div>
              )}
              {visit.utmMedium && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-slate-400 dark:text-slate-500">UTM medium</dt>
                  <dd className="text-end text-slate-700 dark:text-slate-300">{visit.utmMedium}</dd>
                </div>
              )}
              {visit.utmCampaign && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-slate-400 dark:text-slate-500">UTM campaign</dt>
                  <dd className="text-end text-slate-700 dark:text-slate-300">{visit.utmCampaign}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">Landing page</dt>
                <dd className="text-end font-mono text-xs text-slate-700 dark:text-slate-300">
                  {visit.landingPath}
                </dd>
              </div>
            </dl>
          </div>

          <div className={`p-5 ${glassCard}`}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Location</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">Country</dt>
                <dd className="text-end text-slate-700 dark:text-slate-300">{visit.country ?? "—"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">Region</dt>
                <dd className="text-end text-slate-700 dark:text-slate-300">{visit.region ?? "—"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">City</dt>
                <dd className="text-end text-slate-700 dark:text-slate-300">{visit.city ?? "—"}</dd>
              </div>
            </dl>
          </div>

          {visit.userAgent && (
            <div className={`p-5 ${glassCard}`}>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Device</h2>
              <p className="mt-2 text-xs break-all text-slate-500 dark:text-slate-400">{visit.userAgent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
