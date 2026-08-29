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
  abandonedCount,
  onNavigate,
}: {
  abandonedCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="block px-6 pt-6 pb-2">
        <Image
          src="/brand/logo-black.svg"
          alt="Capitres"
          width={867}
          height={99}
          className="h-4 w-auto"
        />
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                className={`flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </span>
                {item.href === "/admin/abandoned" && abandonedCount > 0 && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                      active ? "bg-white text-slate-900" : "bg-red-500 text-white"
                    }`}
                  >
                    {abandonedCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-slate-100 px-4 pt-3 pb-4">
        <form action={logout}>
          <button
            type="submit"
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900"
          >
            <SignOut size={18} aria-hidden="true" />
            Log out
          </button>
        </form>
        <div className="mt-3 flex items-start gap-1.5 px-3 text-[11px] leading-relaxed text-slate-400">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny footer mark, next/image is overkill */}
          <img src="/brand/growli-icon.png" alt="" className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
          <div>
            <p>
              Made by{" "}
              <a
                href="https://growli.media"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-600 transition-colors hover:text-slate-900"
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
