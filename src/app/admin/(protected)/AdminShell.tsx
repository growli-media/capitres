"use client";

import { useEffect, useState } from "react";
import { List, SidebarSimple } from "@phosphor-icons/react";
import AdminNav from "./AdminNav";
import ThemeToggle from "./ThemeToggle";
import { glassPanel, glassIconButton, sidebarGlass } from "../glass";

const THEME_KEY = "capitres-admin-theme";

/**
 * Admin chrome: a full-height sticky sidebar that keeps Log out and the
 * footer pinned in view no matter how long the page is, a desktop
 * collapse toggle for a full-width main area, and a slide-in drawer on
 * mobile (where the sidebar is otherwise hidden).
 *
 * Also owns dark-mode state for the whole (protected) tree. The class
 * lives on this root div (id="admin-shell"), never on <html> — see the
 * `@custom-variant dark` in globals.css — so it can never leak into the
 * public storefront. The inline script below is what avoids a flash of
 * the wrong theme: it runs synchronously as the server-rendered HTML is
 * parsed, before this component hydrates, reading the same localStorage
 * key `dark` below reads in its own effect. suppressHydrationWarning is
 * needed on this one element because the script may have already changed
 * its class attribute by the time React hydrates — that's expected, not
 * a real mismatch to warn about.
 */
export default function AdminShell({
  badgeCounts,
  children,
}: {
  badgeCounts: Partial<Record<string, number>>;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Syncs React state to match localStorage (a client-only API) so later
    // toggles work — the inline script above already applied the class to
    // the DOM directly, so there's no visible flash from this running late.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(localStorage.getItem(THEME_KEY) === "dark");
  }, []);

  function toggleDark() {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        // Private browsing / storage blocked — theme just won't persist.
      }
      return next;
    });
  }

  return (
    <div
      id="admin-shell"
      suppressHydrationWarning
      className={`admin-gradient-bg relative flex min-h-dvh ${dark ? "admin-dark" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before hydration to avoid a flash of the wrong theme */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="dark"){document.getElementById("admin-shell").classList.add("admin-dark")}}catch(e){}`,
        }}
      />

      {/* Large, heavily-blurred light sources drifting slowly across the
          background — layered on top of admin-gradient-bg's subtle
          position shift so there's a visible moving light, not just an
          almost-imperceptible color wash. Fixed + overflow-hidden on the
          wrapper so the blobs never introduce page scroll. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="motion-safe:animate-glow-drift-a absolute -left-1/4 top-1/4 h-[36rem] w-[36rem] rounded-full bg-blue-300/35 blur-3xl dark:bg-blue-500/10" />
        <div className="motion-safe:animate-glow-drift-b absolute -right-1/4 bottom-1/4 h-[32rem] w-[32rem] rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-500/5" />
      </div>

      {/* Desktop sidebar — sticky, full viewport height */}
      <aside
        className={`sticky top-0 z-10 hidden h-dvh shrink-0 overflow-hidden border-e transition-[width] duration-200 md:block ${sidebarGlass} ${
          collapsed ? "w-0 border-e-0" : "w-64"
        }`}
      >
        <div className="h-full w-64">
          <AdminNav badgeCounts={badgeCounts} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Darkened, not blurred — matches Modal.tsx's backdrop; opening
              the mobile menu should dim the page, not obscure it. */}
          <div
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className={`absolute inset-y-0 start-0 h-dvh w-64 border-e shadow-xl ${sidebarGlass}`}>
            <AdminNav
              badgeCounts={badgeCounts}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Slim top bar with the menu toggle */}
        <div className={`sticky top-0 z-30 flex h-12 items-center gap-2 border-b px-3 ${glassPanel}`}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className={`h-9 w-9 cursor-pointer md:hidden ${glassIconButton}`}
          >
            <List size={20} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
            aria-pressed={collapsed}
            className={`hidden h-9 w-9 cursor-pointer md:flex ${glassIconButton}`}
          >
            <SidebarSimple size={18} />
          </button>
          <div className="ms-auto">
            <ThemeToggle dark={dark} onToggle={toggleDark} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
