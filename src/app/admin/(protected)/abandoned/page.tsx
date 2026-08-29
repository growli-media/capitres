import type { Metadata } from "next";
import { WhatsappLogo, Phone, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { ABANDONED_GRACE_MINUTES, listAbandonedOrders } from "@/lib/admin/queries";
import { toWhatsAppLink } from "@/lib/admin/whatsapp";
import { formatIQD } from "@/lib/money";
import CancelOrderButton from "../orders/CancelOrderButton";
import NoteButton from "../orders/NoteButton";
import { glassCard, glassTone, glassIconButton } from "../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Abandoned carts" };

function timeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AbandonedCartsPage() {
  await requirePermission("abandoned_carts");
  const carts = await listAbandonedOrders();
  const totalValue = carts.reduce((sum, c) => sum + c.total, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Abandoned carts
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Checkouts started but never paid, at least {ABANDONED_GRACE_MINUTES} minutes
        old — reach out while they still remember what they wanted.
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
            No abandoned carts right now — nice.
          </p>
        </div>
      ) : (
        <div className={`mt-6 overflow-hidden ${glassCard}`}>
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
      )}
    </div>
  );
}
