"use client";

import { useState, useTransition } from "react";
import { cancelOrderAction } from "./actions";

/** Orders that have already been paid or are already terminal never show
 * this button — see the comment on cancelOrderAction for why. */
const CANCELABLE_STATUSES = ["Created", "Pending", "Processing", "CashOnDelivery"];

export default function CancelOrderButton({
  orderRef,
  status,
}: {
  orderRef: string;
  status: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!CANCELABLE_STATUSES.includes(status)) return null;

  if (confirming) {
    return (
      <button
        type="button"
        onClick={() => startTransition(() => cancelOrderAction(orderRef))}
        disabled={pending}
        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-red-500"
      >
        Confirm cancel?
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
    >
      Cancel order
    </button>
  );
}
