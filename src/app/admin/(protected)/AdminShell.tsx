"use client";

import { useState } from "react";
import { List, SidebarSimple } from "@phosphor-icons/react";
import AdminNav from "./AdminNav";

/**
 * Admin chrome: a full-height sticky sidebar that keeps Log out and the
 * footer pinned in view no matter how long the page is, a desktop
 * collapse toggle for a full-width main area, and a slide-in drawer on
 * mobile (where the sidebar is otherwise hidden).
 */
export default function AdminShell({
  abandonedCount,
  children,
}: {
  abandonedCount: number;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-slate-50">
      {/* Desktop sidebar — sticky, full viewport height */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-slate-200 bg-white transition-[width] duration-200 md:block ${
          collapsed ? "w-0 border-e-0" : "w-64 border-e"
        }`}
      >
        <div className="h-full w-64">
          <AdminNav abandonedCount={abandonedCount} />
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
          <aside className="absolute inset-y-0 start-0 h-dvh w-64 border-e border-slate-200 bg-white shadow-xl">
            <AdminNav
              abandonedCount={abandonedCount}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Slim top bar with the menu toggle */}
        <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-slate-200 bg-white/85 px-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            <List size={20} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
            aria-pressed={collapsed}
            className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:flex"
          >
            <SidebarSimple size={18} />
          </button>
        </div>

        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
