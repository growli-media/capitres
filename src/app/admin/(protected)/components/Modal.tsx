"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { glassPanel, glassIconButton } from "../../glass";

/**
 * Shared overlay primitive. Portals to #admin-shell (the dark-mode root),
 * NOT document.body — a body portal would sit outside the `.admin-dark`
 * DOM-descendant CSS selector (portals preserve React-tree context, not
 * DOM ancestry) and dark: classes would silently never activate.
 *
 * Portaling at all (rather than rendering inline, as this component used
 * to) turned out to be necessary, not optional: when Modal is used from
 * SupportPanel, its React-tree ancestor chain runs through AdminNav →
 * the sidebar <aside>, which has overflow-hidden (needed for its
 * collapse-width animation). Chromium clips fixed-position descendants
 * to an overflow-hidden ancestor's own box in practice, even though the
 * CSS spec doesn't require it — confirmed by inspecting the rendered
 * modal's bounding rect, which was constrained to the sidebar's ~256px
 * width instead of the viewport. Portaling to #admin-shell (a sibling of
 * the sidebar, not a descendant) escapes that clip while still landing
 * inside .admin-dark.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Darkened, not blurred — the page behind should read as dimmed,
          not obscured by blur. The glass panel below keeps its own blur,
          so the "liquid glass" look stays on the surface meant to have
          it, not the backdrop. */}
      <div
        className="absolute inset-0 bg-slate-950/55 dark:bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative w-full max-w-md rounded-2xl border p-6 ${glassPanel}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`h-8 w-8 shrink-0 ${glassIconButton}`}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  const portalTarget = document.getElementById("admin-shell") ?? document.body;
  return createPortal(modal, portalTarget);
}
