"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineUp,
  CurrencyCircleDollar,
  MagnifyingGlass,
  Receipt,
  ShoppingCartSimple,
  SidebarSimple,
  SignOut,
  Stack,
  Star,
  Tag,
  TShirt,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { logout } from "../logout-action";
import SupportPanel from "./components/SupportPanel";
import { OPEN_COMMAND_PALETTE_EVENT } from "./components/CommandPalette";
import ThemeToggle from "./ThemeToggle";
import type { AccessLevel } from "@/lib/admin/permissions";

/** Same pill language as the Support/Log out buttons below (color-on-navy
 * in dark mode, not the general-purpose glassIconButton), sized down into
 * a circle — used for the two controls that now live inside the sidebar
 * itself (collapse/close toggle, theme toggle) instead of floating over
 * the page as separate buttons. */
const navIconButton =
  "flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#1B3445]/10 bg-[#1B3445]/[0.03] text-[#5A7387] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md transition-all hover:border-[#1B3445]/20 hover:bg-[#1B3445]/[0.06] hover:text-[#1B3445] dark:border-white/12 dark:bg-white/5 dark:text-[#aebfce] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:hover:border-white/25 dark:hover:bg-white/12 dark:hover:text-white dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]";

/** `permission: null` means always visible — Team included: every team
 * member can now reach the page (it shows their own profile card unless
 * they have full control, see team/page.tsx's canManage split), so
 * there's no longer any reason to hide the nav link itself. */
const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: ChartLineUp, exact: true, permission: null },
  { href: "/admin/revenue", label: "Revenue", icon: CurrencyCircleDollar, exact: false, permission: "revenue" },
  { href: "/admin/products", label: "Products", icon: TShirt, exact: false, permission: "products" },
  { href: "/admin/collections", label: "Collections", icon: Stack, exact: false, permission: "collections" },
  { href: "/admin/categories", label: "Categories", icon: Tag, exact: false, permission: "categories" },
  { href: "/admin/abandoned", label: "Abandoned carts", icon: ShoppingCartSimple, exact: false, permission: "abandoned_carts" },
  { href: "/admin/orders", label: "Orders", icon: Receipt, exact: false, permission: "orders" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, exact: false, permission: "reviews" },
  { href: "/admin/team", label: "Team", icon: UsersThree, exact: false, permission: null },
] as const;

export default function AdminNav({
  badgeCounts,
  access,
  onNavigate,
  dark,
  onToggleDark,
  onToggleSidebar,
  sidebarToggleVariant = "collapse",
}: {
  badgeCounts: Partial<Record<string, number>>;
  access: AccessLevel;
  onNavigate?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  onToggleSidebar: () => void;
  /** "collapse" for the desktop floating sidebar (SidebarSimple icon,
   * slides the panel away), "close" for the mobile drawer (X icon,
   * closes it) — same handler either way (AdminShell's toggleSidebar
   * flips both bits of state together; whichever doesn't apply at the
   * current viewport is simply inert). */
  sidebarToggleVariant?: "collapse" | "close";
}) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.permission === null) return true;
    return access.isOwner || access.fullAccess || (access.permissions as readonly string[]).includes(item.permission);
  });

  return (
    <nav className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 px-6 pt-6 pb-2">
        <Link href="/admin" onClick={onNavigate} className="group block min-w-0">
          {/* Sidebar is white-dominant in light mode, navy in dark mode (see
              globals.css's .sidebar-glass-bg / .admin-dark .sidebar-glass-bg)
              — same dark: swap the wordmark uses everywhere else. */}
          <Image
            src="/brand/logo-black.svg"
            alt="Capitres"
            width={867}
            height={99}
            priority
            className="h-4 w-auto transition-transform duration-300 ease-out group-hover:scale-[1.03] group-hover:drop-shadow-sm dark:hidden"
          />
          <Image
            src="/brand/logo-white.svg"
            alt="Capitres"
            width={867}
            height={99}
            priority
            className="hidden h-4 w-auto transition-transform duration-300 ease-out group-hover:scale-[1.03] group-hover:drop-shadow-sm dark:block"
          />
          <span className="mt-1 block text-[10px] font-semibold tracking-wider text-[#5A7387] uppercase dark:text-[#aebfce]">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarToggleVariant === "close" ? "Close sidebar" : "Hide sidebar"}
          className={`${navIconButton} mt-0.5 h-8 w-8`}
        >
          {sidebarToggleVariant === "close" ? <X size={14} /> : <SidebarSimple size={14} />}
        </button>
      </div>

      <div className="px-4 pt-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT))}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-[#1B3445]/10 bg-[#1B3445]/[0.03] px-3 text-sm font-medium text-[#5A7387] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md transition-all hover:border-[#1B3445]/20 hover:bg-[#1B3445]/[0.06] hover:text-[#1B3445] dark:border-white/12 dark:bg-white/5 dark:text-[#aebfce] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:hover:border-white/25 dark:hover:bg-white/12 dark:hover:text-white dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
        >
          <span className="flex items-center gap-3">
            <MagnifyingGlass size={16} aria-hidden="true" />
            Search
          </span>
          <kbd className="rounded border border-current/20 px-1.5 py-0.5 text-[10px] font-medium opacity-70">
            ⌘K
          </kbd>
        </button>
      </div>

      <ul className="mt-4 flex-1 space-y-2 overflow-y-auto px-4">
        {visibleItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-full border px-3 text-sm font-medium backdrop-blur-md transition-all ${
                  active
                    ? "border-[#8FC7EF]/60 bg-gradient-to-b from-[#8FC7EF]/30 to-[#8FC7EF]/10 text-[#1B3445] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                    : "border-[#1B3445]/10 bg-[#1B3445]/[0.03] text-[#5A7387] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:border-[#1B3445]/20 hover:bg-[#1B3445]/[0.06] hover:text-[#1B3445] dark:border-white/12 dark:bg-white/5 dark:text-[#aebfce] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:hover:border-white/25 dark:hover:bg-white/12 dark:hover:text-white dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </span>
                {!!badgeCounts[item.href] && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    {badgeCounts[item.href]}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-[#1B3445]/10 px-4 pt-3 pb-4 dark:border-white/15">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SupportPanel />
          </div>
          <ThemeToggle dark={dark} onToggle={onToggleDark} className={`${navIconButton} h-11 w-11`} />
        </div>
        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-full border border-[#1B3445]/10 bg-[#1B3445]/[0.03] px-3 text-sm font-medium text-[#5A7387] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md transition-all hover:border-[#1B3445]/20 hover:bg-[#1B3445]/[0.06] hover:text-[#1B3445] dark:border-white/12 dark:bg-white/5 dark:text-[#aebfce] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:hover:border-white/25 dark:hover:bg-white/12 dark:hover:text-white dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
          >
            <SignOut size={18} aria-hidden="true" />
            Log out
          </button>
        </form>
        <div className="mt-3 flex items-start gap-1.5 px-3 text-[11px] leading-relaxed text-[#5A7387] dark:text-[#aebfce]">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny footer mark, next/image is overkill */}
          <img
            src="/brand/growli-icon.png"
            alt=""
            className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70 dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny footer mark, next/image is overkill */}
          <img
            src="/brand/growli-icon-white.png"
            alt=""
            className="mt-0.5 hidden h-3.5 w-3.5 shrink-0 opacity-80 dark:block"
          />
          <div>
            <p>
              Made by{" "}
              <a
                href="https://growli.media"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#1B3445] transition-colors hover:text-[#2A4A61] dark:text-white/90 dark:hover:text-white"
              >
                Growli Media
              </a>{" "}
              in Germany
            </p>
            <p className="font-light italic">Growth through creativity</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
