"use client";

import { useState, useTransition } from "react";
import { WhatsappLogo, Phone, EnvelopeSimple } from "@phosphor-icons/react";
import { toWhatsAppLink } from "@/lib/admin/whatsapp";
import { formatIQD } from "@/lib/money";
import CancelOrderButton from "../orders/CancelOrderButton";
import NoteButton from "../orders/NoteButton";
import TimeRangeSlider from "../components/TimeRangeSlider";
import { getAbandonedForRangeAction } from "./actions";
import type { AbandonedOrder } from "@/lib/admin/queries";
import { DEFAULT_TIME_RANGE, type TimeRangeKey } from "@/lib/admin/time-range";
import { ABANDONED_GRACE_MINUTES } from "@/lib/admin/queries-shared";
import { glassCard, glassTone, glassIconButton } from "../../glass";

function timeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AbandonedView({ initial }: { initial: AbandonedOrder[] }) {
  const [range, setRange] = useState<TimeRangeKey>(DEFAULT_TIME_RANGE);
  const [carts, setCarts] = useState<AbandonedOrder[]>(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(key: TimeRangeKey) {
    setRange(key);
    startTransition(async () => {
      setCarts(await getAbandonedForRangeAction(key));
    });
  }

  const totalValue = carts.reduce((sum, c) => sum + c.total, 0);

  return (
    <div>
      <TimeRangeSlider value={range} onChange={handleChange} pending={isPending} />
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        Checkouts started but never paid, at least {ABANDONED_GRACE_MINUTES} minutes old and within
        the selected range — reach out while they still remember what they wanted.
      </p>

      {carts.length > 0 && (
        <div className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${glassTone.warning}`}>
          {carts.length} {carts.length === 1 ? "customer" : "customers"} to follow up
          with — {formatIQD(totalValue, "en")} in unpaid carts.
        </div>
      )}

      {carts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No abandoned carts in this range — nice.
          </p>
        </div>
      ) : (
        <div className={`transition-opacity ${isPending ? "opacity-60" : ""}`}>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="mt-6 space-y-3 md:hidden">
            {carts.map((c) => (
              <div key={c.ref} className={`p-4 ${glassCard}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{c.customerName}</p>
                    {c.phone && (
                      <p className="text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                        {c.phone}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{timeAgo(c.minutesAgo)}</span>
                </div>
                <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-400">
                  {c.itemCount} item{c.itemCount === 1 ? "" : "s"} — {c.itemTitles.join(", ")}
                </p>
                <p className="price mt-1 font-medium text-slate-900 dark:text-slate-100">
                  {formatIQD(c.total, "en")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <NoteButton orderRef={c.ref} initialNote={c.adminNote} />
                  {c.phone && (
                    <>
                      <a
                        href={toWhatsAppLink(
                          c.phone,
                          `Hi ${c.customerName}, this is Capitres — noticed you didn't finish your order. Can I help with anything?`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/70 ${glassTone.success}`}
                      >
                        <WhatsappLogo size={15} weight="fill" />
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${c.phone}`}
                        aria-label="Call customer"
                        className={`h-9 w-9 ${glassIconButton}`}
                      >
                        <Phone size={16} />
                      </a>
                    </>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}?subject=${encodeURIComponent(
                        "Your Capitres order",
                      )}&body=${encodeURIComponent(
                        `Hi ${c.customerName}, this is Capitres — noticed you didn't finish your order. Can I help with anything?`,
                      )}`}
                      aria-label="Email customer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      <EnvelopeSimple size={16} />
                    </a>
                  )}
                  {!c.phone && !c.email && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">No contact info</span>
                  )}
                  <CancelOrderButton orderRef={c.ref} status={c.status} />
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
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Cart</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Value</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Abandoned</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {carts.map((c) => (
                    <tr key={c.ref}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{c.customerName}</div>
                        {c.phone && (
                          <div className="text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                            {c.phone}
                          </div>
                        )}
                      </td>
                      <td className="max-w-56 px-4 py-3 text-slate-600 dark:text-slate-400">
                        <p className="truncate">
                          {c.itemCount} item{c.itemCount === 1 ? "" : "s"} —{" "}
                          {c.itemTitles.join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="price font-medium text-slate-900 dark:text-slate-100">
                          {formatIQD(c.total, "en")}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{timeAgo(c.minutesAgo)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <NoteButton orderRef={c.ref} initialNote={c.adminNote} />
                          {c.phone && (
                            <>
                              <a
                                href={toWhatsAppLink(
                                  c.phone,
                                  `Hi ${c.customerName}, this is Capitres — noticed you didn't finish your order. Can I help with anything?`,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/70 ${glassTone.success}`}
                              >
                                <WhatsappLogo size={15} weight="fill" />
                                WhatsApp
                              </a>
                              <a
                                href={`tel:${c.phone}`}
                                aria-label="Call customer"
                                className={`h-9 w-9 ${glassIconButton}`}
                              >
                                <Phone size={16} />
                              </a>
                            </>
                          )}
                          {c.email && (
                            <a
                              href={`mailto:${c.email}?subject=${encodeURIComponent(
                                "Your Capitres order",
                              )}&body=${encodeURIComponent(
                                `Hi ${c.customerName}, this is Capitres — noticed you didn't finish your order. Can I help with anything?`,
                              )}`}
                              aria-label="Email customer"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            >
                              <EnvelopeSimple size={16} />
                            </a>
                          )}
                          {!c.phone && !c.email && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">No contact info</span>
                          )}
                          <CancelOrderButton orderRef={c.ref} status={c.status} />
                        </div>
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
