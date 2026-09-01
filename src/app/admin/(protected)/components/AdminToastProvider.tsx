"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const TOAST_DURATION_MS = 3000;

type Tone = "success" | "danger";

interface ToastState {
  message: string;
  tone: Tone;
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

/**
 * Growli-branded toast — one shared surface for "saved"/"created"/etc.
 * notifications fired from anywhere in the admin, instead of every
 * screen inventing its own. Visual design, portal target (#admin-shell,
 * matching Modal.tsx), and the persistent-node/animate-visibility
 * mechanics (rather than conditional mount via AnimatePresence) are
 * carried over unchanged from the original developer-mode toggle toast
 * this replaces — see GrowliAccessToggle.tsx, which now calls
 * useAdminToast() instead of keeping its own copy of this.
 */
export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);
  // Portal only after mount — document doesn't exist during SSR, and
  // checking `typeof document` directly would make the client's first
  // render pass diverge from the server's, which React's hydration
  // treats as a mismatch rather than a later update.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: standard SSR-safe-portal mount flip, not a derivable value
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setVisible(false), TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [visible]);

  const showToast = useCallback((message: string, tone: Tone = "success") => {
    setToast({ message, tone });
    setVisible(true);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4">
            {toast && (
              <motion.div
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${
                  toast.tone === "success" ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size mark, next/image is overkill */}
                <img src="/brand/growli-icon-white.png" alt="" className="h-5 w-5 shrink-0" />
                {toast.message}
              </motion.div>
            )}
          </div>,
          document.getElementById("admin-shell") ?? document.body,
        )}
    </ToastContext.Provider>
  );
}

/** Call from any client component under AdminToastProvider to fire the
 * branded toast: `showToast("Product saved")` or, for a negative-tone
 * one, `showToast("Order cancelled", "danger")`. */
export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAdminToast must be used within AdminToastProvider");
  return ctx;
}
