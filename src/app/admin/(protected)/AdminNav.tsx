"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLineUp,
  Receipt,
  ShoppingCartSimple,
  SignOut,
  Stack,
  Star,
  TShirt,
} from "@phosphor-icons/react";
import { logout } from "../logout-action";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: ChartLineUp, exact: true },
  { href: "/admin/products", label: "Products", icon: TShirt, exact: false },
  { href: "/admin/collections", label: "Collections", icon: Stack, exact: false },
  { href: "/admin/abandoned", label: "Abandoned carts", icon: ShoppingCartSimple, exact: false },
  { href: "/admin/orders", label: "Orders", icon: Receipt, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
] as const;

export default function AdminNav({
  abandonedCount,
}: {
  abandonedCount: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col justify-between p-4">
      <div>
        <Link href="/admin" className="mb-8 flex items-center gap-2 px-2 pt-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-black text-white">
            C
          </span>
          <span className="text-sm font-bold tracking-tight">
            Capitres Admin
          </span>
        </Link>

        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900"
        >
          <SignOut size={18} aria-hidden="true" />
          Log out
        </button>
      </form>
    </nav>
  );
}
