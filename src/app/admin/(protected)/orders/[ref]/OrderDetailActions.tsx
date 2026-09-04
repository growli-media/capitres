"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, Trash } from "@phosphor-icons/react";
import type { Order } from "@/lib/orders/order-helpers";
import { markOrderDeliveredAction, deleteOrderAction } from "../actions";
import { useAdminToast } from "../../components/AdminToastProvider";
import { glassButtonSecondary, glassButtonPrimary } from "../../../glass";

export default function OrderDetailActions({ order }: { order: Order }) {
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();
  const router = useRouter();

  function markDelivered() {
    startTransition(async () => {
      await markOrderDeliveredAction(order.ref);
      showToast("Order marked as delivered");
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
