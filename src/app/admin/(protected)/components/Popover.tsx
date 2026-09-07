"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { glassPanel } from "../../glass";

const GAP = 8; // space between the anchor and the panel
const VIEWPORT_PADDING = 8; // never let the panel touch the viewport edge

interface PopoverPanelProps {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  align: "start" | "end";
  className: string;
  children: ReactNode;
}

/**
 * Portal-based popover for small anchored menus (kebab menus, the date
 * range picker, …) — replaces the hand-rolled `absolute end-0 top-N`
 * pattern every one of these used to repeat, which had two failure
 * modes: clipped by a scrolling ancestor's overflow (e.g. a table
 * wrapper with overflow-x-auto, which per the CSS spec forces overflow-y
 * to `auto` too) when the panel wasn't portaled, and no collision
 * detection at all, so an anchor near the bottom of the viewport just
 * spilled the panel over whatever content sat below it instead of
 * flipping upward.
 *
 * Portals to #admin-shell for the same reason Modal.tsx does (see that
 * file's own comment) — escapes the sidebar's overflow-hidden clip
 * while staying inside the .admin-dark DOM subtree so dark: classes
 * still apply.
 *
 * Position is computed from the anchor's real getBoundingClientRect() on
 * open, and kept in sync on scroll/resize while open — CSS alone can't
 * know whether there's room below before deciding to flip upward.
 * Admin is English-only/LTR-only (AdminRootLayout hardcodes dir="ltr"),
 * so this works in plain physical left/right pixels rather than
 * logical/RTL-aware values.
 *
 * The outer component only ever mounts PopoverPanel while `open` is
 * true, so every open is a fresh mount with fresh state — no "reset on
 * close" effect branch needed (which would just be setState-in-effect
 * for no benefit; a full remount is the actual React-recommended fix
 * for "reset this state when X changes").
 */
export default function Popover({
  open,
  onClose,
  anchorRef,
  align = "end",
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Which edge of the anchor the panel's own edge lines up with. */
  align?: "start" | "end";
  className?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <PopoverPanel onClose={onClose} anchorRef={anchorRef} align={align} className={className}>
      {children}
    </PopoverPanel>
  );
}

function PopoverPanel({ onClose, anchorRef, align, className, children }: PopoverPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
  const [entered, setEntered] = useState(false);

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();

    let left = align === "end" ? a.right - p.width : a.left;
    left = Math.min(Math.max(left, VIEWPORT_PADDING), window.innerWidth - p.width - VIEWPORT_PADDING);

    const spaceBelow = window.innerHeight - a.bottom;
    const openUpward = spaceBelow < p.height + GAP && a.top > spaceBelow;
    const top = openUpward ? Math.max(a.top - p.height - GAP, VIEWPORT_PADDING) : a.bottom + GAP;

    setPlacement({ top, left, openUpward });
  }, [align, anchorRef]);

  // Measure and position before paint so the panel never flashes at
  // (0,0) — starts invisible via `placement === null`, then this runs
  // synchronously pre-paint and reveals it already in the right spot.
  useLayoutEffect(() => {
    reposition();
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [reposition]);

  useEffect(() => {
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [reposition]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, anchorRef]);

  if (typeof document === "undefined") return null;
  const portalTarget = document.getElementById("admin-shell") ?? document.body;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: placement?.top ?? 0,
        left: placement?.left ?? 0,
        visibility: placement ? "visible" : "hidden",
        transformOrigin: placement?.openUpward ? "bottom" : "top",
      }}
      className={`z-[110] transition-[opacity,transform] duration-150 ease-out ${glassPanel} ${
        entered ? "scale-100 opacity-100" : "scale-95 opacity-0"
      } ${className}`}
    >
      {children}
    </div>,
    portalTarget,
  );
}
