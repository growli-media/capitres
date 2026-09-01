"use client";

import { useState, useTransition } from "react";
import { cancelOrderAction } from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";

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
  const showToast = useAdminToast();

  if (!CANCELABLE_STATUSES.includes(status)) return null;

  if (confirming) {
    return (
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await cancelOrderAction(orderRef);
            showToast("Order cancelled");
          })
        }
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
      className="rounded-full border border-slate-300/70 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-500 backdrop-blur-md transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
    >
      Cancel order
    </button>
  );
}
