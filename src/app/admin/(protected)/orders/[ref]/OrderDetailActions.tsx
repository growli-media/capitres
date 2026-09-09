"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise, Printer, Trash } from "@phosphor-icons/react";
import type { Order } from "@/lib/orders/order-helpers";
import { PAID_STATUSES } from "@/lib/admin/queries-shared";
import {
  markOrderDeliveredAction,
  deleteOrderAction,
  setOrderStatusAction,
  checkWaylStatusAction,
} from "../actions";
import { useAdminToast } from "../../components/AdminToastProvider";
import { glassButtonSecondary, glassButtonPrimary } from "../../../glass";

/** Kept in sync with PAID_ORDER_NEXT_STATUSES in actions.ts — the server
 * action re-validates this list itself, this is just what's offered. */
const PAID_ORDER_NEXT_STATUSES = ["Delivered", "Returned", "Rejected", "Complete"] as const;

export default function OrderDetailActions({ order }: { order: Order }) {
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();
  const router = useRouter();
  const isPaid = (PAID_STATUSES as readonly string[]).includes(order.status);

  function markDelivered() {
    startTransition(async () => {
      await markOrderDeliveredAction(order.ref);
      showToast("Order marked as delivered");
    });
  }

  function changeStatus(status: (typeof PAID_ORDER_NEXT_STATUSES)[number]) {
    startTransition(async () => {
      await setOrderStatusAction(order.ref, status);
      showToast(`Order marked ${status.toLowerCase()}`);
      router.refresh();
    });
  }

  function checkWayl() {
    startTransition(async () => {
      const result = await checkWaylStatusAction(order.ref);
      if ("error" in result) {
        showToast(result.error);
        return;
      }
      showToast(result.changed ? `Updated from Wayl — now ${result.status}` : `Still ${result.status} on Wayl`);
      if (result.changed) router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete order ${order.ref}? You can restore it from Recently deleted for 60 days.`)) return;
    startTransition(async () => {
      await deleteOrderAction(order.ref);
      showToast("Order deleted");
      router.push("/admin/orders");
    });
  }

  return (
    <>
      {isPaid && (
        <select
          disabled={pending}
          value=""
          onChange={(e) => {
            const status = e.target.value as (typeof PAID_ORDER_NEXT_STATUSES)[number];
            if (status) changeStatus(status);
          }}
          aria-label="Change order status"
          className={`h-10 px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${glassButtonSecondary}`}
        >
          <option value="">Change status…</option>
          {PAID_ORDER_NEXT_STATUSES.filter((s) => s !== order.status).map((s) => (
            <option key={s} value={s}>
              {s === "Delivered"
                ? "Mark as delivered"
                : s === "Returned"
                  ? "Mark as returned"
                  : s === "Rejected"
                    ? "Flag a problem (rejected)"
                    : "Mark as complete"}
            </option>
          ))}
        </select>
      )}
      {!order.mock && order.status !== "CashOnDelivery" && (
        <button
          type="button"
          disabled={pending}
          onClick={checkWayl}
          title="Ask Wayl for this order's live status"
          className={`flex h-10 items-center gap-1.5 px-3.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 ${glassButtonSecondary}`}
        >
          <ArrowsClockwise size={15} />
          Check Wayl
        </button>
      )}
      <button
        type="button"
        onClick={() => window.print()}
        className={`flex h-10 items-center gap-1.5 px-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 ${glassButtonSecondary}`}
      >
        <Printer size={15} />
        Print
      </button>
      {order.status === "CashOnDelivery" && (
        <button
          type="button"
          disabled={pending}
          onClick={markDelivered}
          className={`h-10 px-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${glassButtonPrimary}`}
        >
          Mark as delivered
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        aria-label="Delete order"
        title="Delete order"
        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <Trash size={16} />
      </button>
    </>
  );
}
