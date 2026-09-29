"use client";

import { useEffect, useRef } from "react";
import { checkNewOrdersAction } from "../notifications-actions";
import { useAdminToast } from "./AdminToastProvider";
import { formatIQD } from "@/lib/money";

const POLL_MS = 20000;

/**
 * Silent poller, no UI of its own — fires the branded toast the moment a
 * new paid order lands, without a manual refresh. Mounted once, globally
 * (see AdminShell.tsx), alongside NotificationBell but intentionally not
 * merged into it: this is a live, per-tab "heads up" signal with an
 * in-memory cursor (see checkNewOrdersAction's doc comment for why it
 * isn't persisted or written into the activity log).
 */
export default function NewOrderWatcher() {
  const showToast = useAdminToast();
  const sinceRef = useRef(new Date().toISOString());

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const alerts = await checkNewOrdersAction(sinceRef.current);
      if (cancelled || alerts.length === 0) return;
      sinceRef.current = alerts[alerts.length - 1].createdAt;
      for (const a of alerts) {
        showToast(`New order from ${a.customerName} — ${formatIQD(a.total, "en")}`);
      }
    }
    // Skip the DB round trip while this tab isn't the one on screen — a
    // toast in a backgrounded tab was never visible anyway, so nothing is
    // lost by not fetching for it. The moment the tab comes back into
    // view we poll immediately (below) instead of waiting out the rest
    // of the interval, so there's no gap in what you actually see.
    function tick() {
      if (document.visibilityState === "visible") poll();
    }
    const id = setInterval(tick, POLL_MS);
    function onVisibilityChange() {
      if (document.visibilityState === "visible") poll();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [showToast]);

  return null;
}
