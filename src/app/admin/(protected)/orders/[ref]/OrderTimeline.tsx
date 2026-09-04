import { Check, X } from "@phosphor-icons/react/dist/ssr";
import type { Order } from "@/lib/orders/order-helpers";
import { PAID_STATUSES, FAILED_STATUSES } from "@/lib/admin/queries-shared";
import { glassCard } from "../../../glass";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * A step indicator inferred from the order's current status, not a real
 * per-transition history — this app only stores the current status, not
 * a log of every change (see Order in order-helpers.ts). Placed is the
 * only step with a real timestamp; the others just reflect where the
 * order currently sits.
 */
export default function OrderTimeline({ status, createdAt }: { status: Order["status"]; createdAt: string }) {
  const isPaid = (PAID_STATUSES as readonly string[]).includes(status);
  const isFailed = (FAILED_STATUSES as readonly string[]).includes(status);
  const isDelivered = status === "Delivered";
  const isCod = status === "CashOnDelivery";

  if (isFailed) {
    return (
      <div className={`flex items-center gap-4 p-5 ${glassCard}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <X size={16} weight="bold" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{status}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Placed {formatDate(createdAt)}</p>
        </div>
      </div>
    );
  }

  const steps = [
    { label: "Placed", done: true, sub: formatDate(createdAt) },
    {
      label: isCod ? "Cash on delivery" : "Paid",
      done: isPaid || isCod,
      sub: isCod && !isDelivered ? "Awaiting delivery" : undefined,
    },
    { label: "Delivered", done: isDelivered, sub: undefined },
  ];

  return (
    <div className={`flex items-center gap-2 overflow-x-auto p-5 ${glassCard}`}>
      {steps.map((step, i) => (
        <div key={step.label} className="flex shrink-0 items-center gap-2">
          {i > 0 && (
            <div
              className={`h-0.5 w-8 shrink-0 sm:w-16 ${step.done ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}
            />
          )}
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                step.done
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
              }`}
            >
              {step.done && <Check size={14} weight="bold" />}
            </span>
            <div>
              <p
                className={`text-sm font-medium whitespace-nowrap ${
                  step.done ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </p>
              {step.sub && <p className="text-xs whitespace-nowrap text-slate-400 dark:text-slate-500">{step.sub}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
