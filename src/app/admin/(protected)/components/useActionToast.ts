"use client";

import { useEffect, useRef } from "react";
import { useAdminToast } from "./AdminToastProvider";

/**
 * Fires the branded toast the moment a useActionState-backed form
 * transitions from pending back to idle with no error — i.e. right
 * after a successful submit. Skips the initial mount (the ref starts
 * false, so the very first render never counts as "just finished").
 * A create action that redirects on success never triggers this from
 * here (the component unmounts before pending resolves) — see
 * CreatedToast.tsx for that case instead.
 */
export function useActionToast(pending: boolean, error: string | undefined, message: string) {
  const showToast = useAdminToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !error) {
      showToast(message);
    }
    wasPending.current = pending;
  }, [pending, error, message, showToast]);
}
