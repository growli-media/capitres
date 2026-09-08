import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { listAdminPromoCodes, type AdminPromoCode } from "@/lib/admin/promo-codes";
import { orderStore } from "@/lib/orders/store";
import PromoCodeRowActions from "./PromoCodeRowActions";
import { CreatedToast } from "../components/CreatedToast";
import { glassCard, glassButtonPrimary, glassTone } from "../../glass";
import { requirePermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Promo codes" };

function discountLabel(p: AdminPromoCode): string {
  if (p.type === "free-shipping") return "Free shipping";
  if (p.type === "percent") return `${p.value}% off`;
  if (p.type === "bogo") return `Buy ${p.buyQty} get ${p.getQty} (${p.getDiscountPercent}% off)`;
  return `${(p.value ?? 0).toLocaleString("en-US")} IQD off`;
}

function regionLabel(p: AdminPromoCode): string | null {
  if (p.region === "IQ") return "Iraq only";
  if (p.region === "INTL") return "International only";
  return null;
}

/** starts_at/ends_at are stored as UTC day-boundaries (see actions.ts's
 * parseDateBoundary) — timeZone: "UTC" is required here, not cosmetic:
 * without it, this renders in the server runtime's own local timezone,
 * which can shift the displayed calendar date by a day. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function windowLabel(p: AdminPromoCode): string {
  if (p.startsAt && p.endsAt) return `${formatDate(p.startsAt)} – ${formatDate(p.endsAt)}`;
  if (p.startsAt) return `From ${formatDate(p.startsAt)}`;
  if (p.endsAt) return `Until ${formatDate(p.endsAt)}`;
  return "No end date";
}

type Status = "Scheduled" | "Active" | "Expired" | "Used up";

function statusOf(p: AdminPromoCode, used: number): Status {
  const now = Date.now();
  if (p.startsAt && new Date(p.startsAt).getTime() > now) return "Scheduled";
  if (p.endsAt && new Date(p.endsAt).getTime() < now) return "Expired";
  if (p.maxUses !== null && used >= p.maxUses) return "Used up";
  return "Active";
}

const STATUS_TONE: Record<Status, string> = {
  Active: glassTone.success,
  Scheduled: glassTone.info,
  Expired: glassTone.neutral,
  "Used up": glassTone.warning,
};

export default async function AdminPromoCodesPage() {
  await requirePermission("promo_codes");
  const [promoCodes, usageCounts] = await Promise.all([
    listAdminPromoCodes(),
    orderStore.countsByPromoCode(),
  ]);

  return (
    <div>
      <CreatedToast param="deleted" message="Promo code deleted" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Promo codes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {promoCodes.length} total — live at checkout the moment you save.
          </p>
        </div>
        <Link
          href="/admin/promo-codes/new"
          className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 px-4 text-sm font-semibold ${glassButtonPrimary}`}
        >
          <Plus size={16} aria-hidden="true" />
          New promo code
        </Link>
      </div>

      {promoCodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No promo codes yet.</p>
          <Link
            href="/admin/promo-codes/new"
            className={`mt-4 inline-flex h-10 cursor-pointer items-center px-4 text-sm font-semibold ${glassButtonPrimary}`}
          >
            Create your first promo code
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="space-y-3 md:hidden">
            {promoCodes.map((p) => {
              const used = usageCounts[p.code] ?? 0;
              const status = statusOf(p, used);
              return (
                <div key={p.code} className={`p-4 ${glassCard}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/promo-codes/${p.code}/edit`}
                        className="block truncate font-mono font-medium text-slate-900 hover:underline dark:text-slate-100"
                      >
                        {p.code}
                      </Link>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{discountLabel(p)}</span>
                    </div>
                    <PromoCodeRowActions code={p.code} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[status]}`}>
                      {status}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{windowLabel(p)}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {used} used{p.maxUses ? ` / ${p.maxUses}` : ""}
                    </span>
                    {regionLabel(p) && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${glassTone.neutral}`}>
                        {regionLabel(p)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className={`hidden overflow-hidden md:block ${glassCard}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Code</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Discount</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Window</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Region</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Uses</th>
                    <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-start font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {promoCodes.map((p) => {
                    const used = usageCounts[p.code] ?? 0;
                    const status = statusOf(p, used);
                    return (
                      <tr key={p.code}>
                        <td className="px-4 py-3 font-mono font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                          <Link href={`/admin/promo-codes/${p.code}/edit`} className="hover:underline">
                            {p.code}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {discountLabel(p)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {windowLabel(p)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {regionLabel(p) ?? "All regions"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {used}
                          {p.maxUses ? ` / ${p.maxUses}` : ""}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[status]}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <PromoCodeRowActions code={p.code} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
