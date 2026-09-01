"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminToast } from "./AdminToastProvider";

/**
 * Fires the branded toast once on mount when the page was just reached
 * via a redirect that appended `?<param>=1` — used after create/delete
 * actions, which redirect() rather than resolving useActionState (so
 * useActionToast's pending->idle transition never happens; the
 * destination page has to pick the signal up from the URL instead).
 * Doesn't strip the query param afterward, matching this app's existing
 * `created === "1"` inline-banner pages, which have the same tolerance
 * for a stale query string on refresh.
 */
export function CreatedToast({ param = "created", message }: { param?: string; message: string }) {
  const searchParams = useSearchParams();
  const showToast = useAdminToast();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (searchParams.get(param) !== "1") return;
    fired.current = true;
    showToast(message);
  }, [searchParams, param, message, showToast]);

  return null;
}
