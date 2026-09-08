"use client";

import { useActionState, useState } from "react";
import type { AdminPromoCode, PromoCodeType } from "@/lib/admin/promo-codes";
import { createPromoCodeAction, updatePromoCodeAction, type FormState } from "./actions";
import { useActionToast } from "../components/useActionToast";
import { glassInput, glassButtonPrimary, glassTone } from "../../glass";

const inputClass = `h-10 w-full px-3 ${glassInput}`;

/** ISO timestamp -> the YYYY-MM-DD an <input type="date"> expects — dates
 * are stored as UTC day-boundaries (see actions.ts's parseDateBoundary),
 * so slicing is exact, no timezone conversion needed. */
function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export default function PromoCodeForm({
  promoCode,
  usageCount,
}: {
  promoCode?: AdminPromoCode;
  /** Only known (and shown) in edit mode — how many orders have already
   * used this code, against its max-uses limit. */
  usageCount?: number;
}) {
  const mode = promoCode ? "edit" : "create";
  const action = promoCode ? updatePromoCodeAction.bind(null, promoCode.code) : createPromoCodeAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  useActionToast(pending, state.error, "Promo code saved");
  const [type, setType] = useState<PromoCodeType>(promoCode?.type ?? "percent");

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="pc-code" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          Code
        </label>
        <input
          id="pc-code"
          type="text"
          name="code"
          required
          disabled={mode === "edit"}
          defaultValue={promoCode?.code}
          placeholder="e.g. WELCOME10"
          className={`${inputClass} font-mono uppercase`}
        />
        {mode === "edit" && (
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
            The code itself can&apos;t be changed once created — delete and recreate it instead.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="pc-type" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          Discount
        </label>
        <select
          id="pc-type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as PromoCodeType)}
          className={`${inputClass} cursor-pointer appearance-none`}
        >
          <option value="percent">Percentage off</option>
          <option value="fixed">Fixed amount off (IQD)</option>
          <option value="free-shipping">Free shipping</option>
        </select>
      </div>

      {type !== "free-shipping" && (
        <div>
          <label htmlFor="pc-value" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
            {type === "percent" ? "Percentage (1–100)" : "Amount (IQD)"}
          </label>
          <input
            id="pc-value"
            type="number"
            name="value"
            required
            min={1}
            max={type === "percent" ? 100 : undefined}
            step={1}
            defaultValue={promoCode?.value ?? ""}
            className={inputClass}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="pc-starts" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
            Starts
          </label>
          <input
            id="pc-starts"
            type="date"
            name="startsAt"
            defaultValue={toDateInputValue(promoCode?.startsAt ?? null)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Leave blank to start immediately.</p>
        </div>
        <div>
          <label htmlFor="pc-ends" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
            Ends
          </label>
          <input
            id="pc-ends"
            type="date"
            name="endsAt"
            defaultValue={toDateInputValue(promoCode?.endsAt ?? null)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Leave blank for no end date.</p>
        </div>
      </div>

      <div>
        <label htmlFor="pc-max-uses" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          Max uses
        </label>
        <input
          id="pc-max-uses"
          type="number"
          name="maxUses"
          min={1}
          step={1}
          defaultValue={promoCode?.maxUses ?? ""}
          placeholder="Unlimited"
          className={inputClass}
        />
        {mode === "edit" && (
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
            Used {usageCount ?? 0} time{usageCount === 1 ? "" : "s"} so far
            {promoCode?.maxUses ? ` — ${promoCode.maxUses} max` : ""}.
          </p>
        )}
      </div>

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className={`rounded-lg px-4 py-3 text-sm font-medium ${glassTone.danger}`}>
            {state.error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        <button
          type="submit"
          disabled={pending}
          className={`flex h-11 cursor-pointer items-center px-6 text-sm font-semibold disabled:cursor-not-allowed ${glassButtonPrimary}`}
        >
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create promo code"}
        </button>
      </div>
    </form>
  );
}
