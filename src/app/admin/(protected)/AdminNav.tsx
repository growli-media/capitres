"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineUp,
  Receipt,
  ShoppingCartSimple,
  SignOut,
  Stack,
  Star,
  Tag,
  TShirt,
  UsersThree,
} from "@phosphor-icons/react";
import { logout } from "../logout-action";
import SupportPanel from "./components/SupportPanel";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: ChartLineUp, exact: true },
  { href: "/admin/products", label: "Products", icon: TShirt, exact: false },
  { href: "/admin/collections", label: "Collections", icon: Stack, exact: false },
  { href: "/admin/categories", label: "Categories", icon: Tag, exact: false },
  { href: "/admin/abandoned", label: "Abandoned carts", icon: ShoppingCartSimple, exact: false },
  { href: "/admin/orders", label: "Orders", icon: Receipt, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
  { href: "/admin/team", label: "Team", icon: UsersThree, exact: false },
] as const;

export default function AdminNav({
  badgeCounts,
  onNavigate,
}: {
  badgeCounts: Partial<Record<string, number>>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="group block px-6 pt-6 pb-2">
        {/* Sidebar is permanently navy (see globals.css's .sidebar-glass-bg)
            regardless of the admin light/dark toggle, so this always uses
            the white wordmark — no dark: swap needed here. */}
        <Image
          src="/brand/logo-white.svg"
          alt="Capitres"
          width={867}
          height={99}
          priority
          className="h-4 w-auto transition-transform duration-300 ease-out group-hover:scale-[1.03] group-hover:drop-shadow-sm"
        />
        <span className="mt-1 block text-[10px] font-semibold tracking-wider text-[#aebfce] uppercase">
          Admin
        </span>
      </Link>

      <ul className="mt-6 flex-1 space-y-1 overflow-y-auto px-4">
        {NAV_ITEMS.map((item) => {
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
                    ? "border-[#8FC7EF]/50 bg-gradient-to-b from-[#8FC7EF]/30 to-[#8FC7EF]/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                    : "border-transparent text-[#aebfce] hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
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

      <div className="border-t border-white/15 px-4 pt-3 pb-4">
        <SupportPanel />
        <form action={logout}>
          <button
            type="submit"
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-full border border-transparent px-3 text-sm font-medium text-[#aebfce] backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          >
            <SignOut size={18} aria-hidden="true" />
            Log out
          </button>
        </form>
        <div className="mt-3 flex items-start gap-1.5 px-3 text-[11px] leading-relaxed text-[#aebfce]">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny footer mark, next/image is overkill */}
          <img
            src="/brand/growli-icon-white.png"
            alt=""
            className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80"
          />
          <div>
            <p>
              Made by{" "}
              <a
                href="https://growli.media"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white/90 transition-colors hover:text-white"
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
