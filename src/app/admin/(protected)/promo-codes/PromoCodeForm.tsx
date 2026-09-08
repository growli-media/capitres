"use client";

import { useActionState, useState } from "react";
import type { AdminPromoCode, PromoCodeType } from "@/lib/admin/promo-codes";
import { createPromoCodeAction, updatePromoCodeAction, type FormState } from "./actions";
import { useActionToast } from "../components/useActionToast";
import BogoPoolPicker, { type PickableCategory } from "./BogoPoolPicker";
import type { PickableProduct } from "../products/RelatedProductsPicker";
import { glassInput, glassButtonPrimary, glassTone } from "../../glass";

const inputClass = `h-10 w-full px-3 ${glassInput}`;

/** ISO timestamp -> the YYYY-MM-DD an <input type="date"> expects — dates
 * are stored as UTC day-boundaries (see actions.ts's parseDateBoundary),
 * so slicing is exact, no timezone conversion needed. */
function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

/** ISO cents -> the dollars/euros string a price <input> expects. */
function toAmountInputValue(cents: number | null): string {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

export default function PromoCodeForm({
  promoCode,
  usageCount,
  products,
  categories,
}: {
  promoCode?: AdminPromoCode;
  /** Only known (and shown) in edit mode — how many orders have already
   * used this code, against its max-uses limit. */
  usageCount?: number;
  /** "bogo" type's buy/get pool pickers — every other product/category in
   * the catalog, same data source products/new & [id]/edit already fetch
   * for RelatedProductsPicker. */
  products: PickableProduct[];
  categories: PickableCategory[];
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
          <option value="fixed">Fixed amount off</option>
          <option value="free-shipping">Free shipping</option>
          <option value="bogo">Buy X, get Y</option>
        </select>
      </div>

      {(type === "percent" || type === "fixed") && (
        <div>
          <label htmlFor="pc-value" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
            {type === "percent" ? "Percentage (1–100)" : "Amount — IQD"}
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

      {type === "fixed" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pc-value-usd" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Amount — USD (optional)
            </label>
            <input
              id="pc-value-usd"
              type="number"
              name="valueUsd"
              min={0.01}
              step={0.01}
              defaultValue={toAmountInputValue(promoCode?.valueUsdCents ?? null)}
              placeholder="e.g. 5.00"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              Blank converts from the IQD amount instead.
            </p>
          </div>
          <div>
            <label htmlFor="pc-value-eur" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Amount — EUR (optional)
            </label>
            <input
              id="pc-value-eur"
              type="number"
              name="valueEur"
              min={0.01}
              step={0.01}
              defaultValue={toAmountInputValue(promoCode?.valueEurCents ?? null)}
              placeholder="e.g. 4.60"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {type === "bogo" && (
        <div className="space-y-4">
          <BogoPoolPicker
            label="Buy — trigger"
            products={products}
            categories={categories}
            productFieldName="buyProductSlugs"
            categoryFieldName="buyCategories"
            defaultSelectedProducts={promoCode?.buyProductSlugs ?? []}
            defaultSelectedCategories={promoCode?.buyCategories ?? []}
          />
          <div>
            <label htmlFor="pc-buy-qty" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Buy quantity
            </label>
            <input
              id="pc-buy-qty"
              type="number"
              name="buyQty"
              required
              min={1}
              step={1}
              defaultValue={promoCode?.buyQty ?? 1}
              className={inputClass}
            />
          </div>

          <BogoPoolPicker
            label="Get — reward"
            products={products}
            categories={categories}
            productFieldName="getProductSlugs"
            categoryFieldName="getCategories"
            defaultSelectedProducts={promoCode?.getProductSlugs ?? []}
            defaultSelectedCategories={promoCode?.getCategories ?? []}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pc-get-qty" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                Get quantity
              </label>
              <input
                id="pc-get-qty"
                type="number"
                name="getQty"
                required
                min={1}
                step={1}
                defaultValue={promoCode?.getQty ?? 1}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="pc-get-discount" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                Reward discount % (100 = free)
              </label>
              <input
                id="pc-get-discount"
                type="number"
                name="getDiscountPercent"
                required
                min={1}
                max={100}
                step={1}
                defaultValue={promoCode?.getDiscountPercent ?? 100}
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            The cheapest eligible reward item(s) in the cart are always the ones discounted — automatic,
            no customer picker. The customer must add the reward product to their cart themselves; its
            price is discounted automatically at checkout if they qualify.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="pc-region" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          Region
        </label>
        <select
          id="pc-region"
          name="region"
          defaultValue={promoCode?.region ?? ""}
          className={`${inputClass} cursor-pointer appearance-none`}
        >
          <option value="">All regions</option>
          <option value="IQ">Iraq only</option>
          <option value="INTL">International only</option>
        </select>
      </div>

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
