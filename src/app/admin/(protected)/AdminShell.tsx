"use client";

import { useEffect, useState } from "react";
import { List, SidebarSimple } from "@phosphor-icons/react";
import AdminNav from "./AdminNav";
import CommandPalette from "./components/CommandPalette";
import NewOrderWatcher from "./components/NewOrderWatcher";
import { glassIconButton, sidebarGlass } from "../glass";
import type { AccessLevel } from "@/lib/admin/permissions";

const THEME_KEY = "capitres-admin-theme";

/**
 * Admin chrome: a floating, deeply-rounded sidebar inset from every edge
 * (not a flush edge-to-edge bar — position: fixed, not sticky-in-flow, so
 * it "hovers" independently of the content column), with no separate top
 * bar or floating buttons at all while it's showing — the sidebar-toggle
 * and theme-toggle controls live inside the sidebar/drawer itself (see
 * AdminNav's header + footer). The only floating buttons rendered here
 * are the two *reopen* handles, and only while there's nothing on screen
 * to click instead: a vertically-centered handle next to the sidebar's
 * position on desktop while it's collapsed, and a hamburger in the usual
 * mobile corner while the drawer is closed. Each disappears the instant
 * the sidebar/drawer it reopens is showing, replaced by that panel's own
 * in-header control — so on mobile the toggle never gets stuck hidden
 * under the drawer's backdrop the way a separate floating button would.
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
  access,
  children,
}: {
  badgeCounts: Partial<Record<string, number>>;
  access: AccessLevel;
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

  /** One button, two contexts: on mobile it opens the slide-in drawer, on
   * desktop it collapses/expands the floating sidebar. Both bits of state
   * update together — whichever one doesn't apply at the current
   * viewport is simply inert (its element is CSS-hidden at that
   * breakpoint), so there's no need to branch on viewport width in JS. */
  function toggleSidebar() {
    setMobileOpen((v) => !v);
    setCollapsed((v) => !v);
  }

  return (
    <div
      id="admin-shell"
      suppressHydrationWarning
      className={`admin-gradient-bg relative min-h-dvh ${dark ? "admin-dark" : ""}`}
    >
      {/* Must run before hydration to avoid a flash of the wrong theme. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="dark"){document.getElementById("admin-shell").classList.add("admin-dark")}}catch(e){}`,
        }}
      />

      {/* Large, heavily-blurred light sources drifting slowly across the
          background — layered on top of admin-gradient-bg's subtle
          position shift so there's a visible moving light, not just an
          almost-imperceptible color wash. Growli's Sky (#8FC7EF) and
          Steel (#5A7387) only — no amber. Fixed + overflow-hidden on the
          wrapper so the blobs never introduce page scroll. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="motion-safe:animate-glow-drift-a absolute -left-1/4 top-1/4 h-[36rem] w-[36rem] rounded-full bg-[#8FC7EF]/35 blur-3xl dark:bg-[#8FC7EF]/10" />
        <div className="motion-safe:animate-glow-drift-b absolute -right-1/4 bottom-1/4 h-[32rem] w-[32rem] rounded-full bg-[#5A7387]/25 blur-3xl dark:bg-[#5A7387]/10" />
      </div>

      {/* Desktop reopen handle — pinned top-start, same corner the sidebar
          itself starts from. Only rendered while collapsed; once the
          sidebar is showing, its own header has this same control (see
          AdminNav). */}
      {collapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Show sidebar"
          className={`fixed top-4 start-4 z-30 hidden h-11 w-11 cursor-pointer md:flex ${glassIconButton}`}
        >
          <SidebarSimple size={19} />
        </button>
      )}

      {/* Mobile hamburger — only rendered while the drawer is closed, so
          it never ends up hidden under the drawer's own backdrop; once
          open, the drawer's header has the close control instead. */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Show sidebar"
          className={`fixed top-4 start-4 z-30 h-11 w-11 cursor-pointer md:hidden ${glassIconButton}`}
        >
          <List size={19} />
        </button>
      )}

      {/* Desktop sidebar — floating, inset from every edge, never flush.
          Collapse slides it out via translate rather than animating
          width to 0 — width-to-0 would flatten the rounded corners as it
          shrinks; a translate keeps the pill shape intact the whole way
          off-screen. */}
      <aside
        className={`fixed inset-y-4 start-4 z-20 hidden w-64 overflow-hidden rounded-[2rem] border transition-transform duration-300 ease-out md:block ${sidebarGlass} ${
          collapsed ? "-translate-x-[calc(100%+2rem)]" : "translate-x-0"
        }`}
      >
        <AdminNav
          badgeCounts={badgeCounts}
          access={access}
          dark={dark}
          onToggleDark={toggleDark}
          onToggleSidebar={toggleSidebar}
          sidebarToggleVariant="collapse"
        />
      </aside>

      {/* Mobile drawer — unchanged flush full-height slide-in; a floating
          inset panel is the wrong pattern for a touch drawer. */}
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
              access={access}
              onNavigate={() => setMobileOpen(false)}
              dark={dark}
              onToggleDark={toggleDark}
              onToggleSidebar={toggleSidebar}
              sidebarToggleVariant="close"
            />
          </aside>
        </div>
      )}

      <CommandPalette access={access} />
      <NewOrderWatcher />

      <main
        className={`relative z-10 min-h-dvh pt-20 transition-[padding] duration-300 ease-out md:pt-8 ${
          collapsed ? "md:ps-8" : "md:ps-[18rem]"
        }`}
      >
        <div className="mx-auto w-full max-w-[1600px] px-5 pb-8 md:px-10 md:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
