import type { VisitEvent } from "@/lib/admin/analytics";
import { glassCard } from "../../../glass";

const EVENT_LABELS: Record<VisitEvent["type"], string> = {
  page_view: "Viewed",
  product_view: "Viewed product",
  add_to_cart: "Added to cart",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** This order's pre-purchase browsing trail — only rendered when the
 * order has a visitorId (see checkout/route.ts) AND that visit still
 * has events (the 90-day retention window can outlive the order; a
 * missing trail past that point is expected, not a bug). */
export default function BrowsingTrail({ events }: { events: VisitEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className={`p-5 ${glassCard}`}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Browsing trail</h2>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        What this customer did before placing this order.
      </p>
      <ol className="mt-3 space-y-2">
        {events.map((event) => (
          <li key={event.id} className="flex items-baseline gap-3 text-sm">
            <span className="w-14 shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
              {formatTime(event.occurredAt)}
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {EVENT_LABELS[event.type]}
              {event.productSlug && (
                <span className="ms-1 font-medium text-slate-900 dark:text-slate-100">{event.productSlug}</span>
              )}
              {!event.productSlug && event.path && (
                <span className="ms-1 font-mono text-xs text-slate-500 dark:text-slate-400">{event.path}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
