"use client";

import { useEffect, useState } from "react";
import { List, SidebarSimple } from "@phosphor-icons/react";
import AdminNav from "./AdminNav";
import ThemeToggle from "./ThemeToggle";

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
      className={`flex min-h-dvh bg-slate-50 dark:bg-slate-950 ${dark ? "admin-dark" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before hydration to avoid a flash of the wrong theme */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="dark"){document.getElementById("admin-shell").classList.add("admin-dark")}}catch(e){}`,
        }}
      />
      {/* Desktop sidebar — sticky, full viewport height */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-slate-200 bg-white transition-[width] duration-200 md:block dark:border-slate-800 dark:bg-slate-900 ${
          collapsed ? "w-0 border-e-0" : "w-64 border-e"
        }`}
      >
        <div className="h-full w-64">
          <AdminNav badgeCounts={badgeCounts} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 start-0 h-dvh w-64 border-e border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <AdminNav
              badgeCounts={badgeCounts}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Slim top bar with the menu toggle */}
        <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-slate-200 bg-white/85 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <List size={20} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
            aria-pressed={collapsed}
            className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:flex dark:text-slate-300 dark:hover:bg-slate-800"
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
