"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/** Buttons for the local simulated Wayl gateway. */
export default function MockPayActions({ orderRef }: { orderRef: string }) {
  const t = useTranslations("checkout.mock");
  const router = useRouter();
  const [busy, setBusy] = useState<"complete" | "cancel" | null>(null);

  async function act(outcome: "complete" | "cancel") {
    setBusy(outcome);
    try {
      await fetch("/api/mock-wayl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: orderRef, outcome }),
      });
    } finally {
      router.push(`/checkout/confirmation?ref=${encodeURIComponent(orderRef)}`);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => act("complete")}
        className="btn btn-ink"
      >
        {t("pay")}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => act("cancel")}
        className="btn btn-outline text-danger hover:border-danger hover:bg-danger hover:text-white"
      >
        {t("cancel")}
      </button>
    </div>
  );
}
