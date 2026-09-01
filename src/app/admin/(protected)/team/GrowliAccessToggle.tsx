"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { setUserFullAccessAction } from "./actions";

const TOAST_DURATION_MS = 3000;

/**
 * The interactive (canToggle) version of the Growli badge — a client
 * component specifically because the toast below needs to react to the
 * action actually completing, which a plain `<form action={...}>`
 * doesn't give a hook for. Calls the server action directly (same
 * pattern as every other range-scoped fetch in this app — see
 * DashboardView.tsx's startTransition + direct-await-server-action
 * usage) rather than submitting a form.
 *
 * The toast node is always mounted once a toast has ever fired and its
 * visibility is driven by animating `visible` (opacity/position), not by
 * conditionally mounting/unmounting via AnimatePresence — that pairs
 * badly with a portal fed by a Server-Component-driven prop update (the
 * revalidatePath this triggers): AnimatePresence's exit tracking didn't
 * reliably fire the node's removal in testing, leaving an invisible
 * (opacity: 0, functionally harmless — pointer-events-none on the
 * wrapper already blocks it) but undead node behind. Toggling `visible`
 * on one persistent node sidesteps that entirely.
 *
 * Portals to #admin-shell, not document.body, matching Modal.tsx's
 * reasoning: that's the element carrying .admin-dark, and a body portal
 * would sit outside the sidebar's own overflow-hidden clipping boundary
 * in a way that's inconsistent with the rest of the admin's overlays.
 */
export default function GrowliAccessToggle({
  userId,
  name,
  fullAccess,
  visual,
}: {
  userId: string;
  name: string;
  fullAccess: boolean;
  visual: React.ReactNode;
}) {
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{ activated: boolean } | null>(null);
  const [visible, setVisible] = useState(false);
  // Portal only after mount — document doesn't exist during SSR, and
  // checking `typeof document` directly would make the client's first
  // render pass diverge from the server's, which React's hydration
  // treats as a mismatch rather than a later update.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: this is the standard SSR-safe-portal mount flip, not a derivable value
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setVisible(false), TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [visible]);

  function handleClick() {
    const next = !fullAccess;
    startTransition(async () => {
      await setUserFullAccessAction(userId, next);
      setToast({ activated: next });
      setVisible(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="cursor-pointer rounded-full"
        aria-label={fullAccess ? "Turn off Growli full access" : "Turn on Growli full access"}
        aria-pressed={fullAccess}
      >
        {visual}
      </button>
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4">
            {toast && (
              <motion.div
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${
                  toast.activated ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size mark, next/image is overkill */}
                <img src="/brand/growli-icon-white.png" alt="" className="h-5 w-5" />
                Developer mode {toast.activated ? "activated" : "deactivated"} for {name}
              </motion.div>
            )}
          </div>,
          document.getElementById("admin-shell") ?? document.body,
        )}
    </>
  );
}
