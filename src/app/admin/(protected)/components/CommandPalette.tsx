"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  ChartLineUp,
  CurrencyCircleDollar,
  Receipt,
  ShoppingCartSimple,
  Stack,
  Star,
  Tag,
  TShirt,
  UsersThree,
  Plus,
  Package,
  ShoppingBag,
} from "@phosphor-icons/react";
import { searchAdminAction, type SearchResult } from "../search-actions";
import type { AccessLevel } from "@/lib/admin/permissions";
import { glassPanel } from "../../glass";

/** AdminNav's visible search trigger dispatches this to open the palette
 * without prop-drilling `open` state through AdminShell — the palette
 * manages its own open/close state entirely and just also listens for
 * this alongside its own ⌘K/Ctrl+K keydown handling. */
export const OPEN_COMMAND_PALETTE_EVENT = "capitres-admin:open-command-palette";

interface StaticCommand {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission: string | null;
  keywords?: string;
}

const STATIC_COMMANDS: StaticCommand[] = [
  { id: "nav-dashboard", label: "Dashboard", href: "/admin", icon: ChartLineUp, permission: null },
  { id: "nav-revenue", label: "Revenue", href: "/admin/revenue", icon: CurrencyCircleDollar, permission: "revenue" },
  { id: "nav-products", label: "Products", href: "/admin/products", icon: TShirt, permission: "products" },
  { id: "nav-collections", label: "Collections", href: "/admin/collections", icon: Stack, permission: "collections" },
  { id: "nav-categories", label: "Categories", href: "/admin/categories", icon: Tag, permission: "categories" },
  { id: "nav-abandoned", label: "Abandoned carts", href: "/admin/abandoned", icon: ShoppingCartSimple, permission: "abandoned_carts" },
  { id: "nav-orders", label: "Orders", href: "/admin/orders", icon: Receipt, permission: "orders" },
  { id: "nav-reviews", label: "Reviews", href: "/admin/reviews", icon: Star, permission: "reviews" },
  { id: "nav-team", label: "Team", href: "/admin/team", icon: UsersThree, permission: null },
  { id: "new-product", label: "New product", href: "/admin/products/new", icon: Plus, permission: "products", keywords: "create add" },
  { id: "new-category", label: "New category", href: "/admin/categories/new", icon: Plus, permission: "categories", keywords: "create add" },
  { id: "new-collection", label: "New collection", href: "/admin/collections/new", icon: Plus, permission: "collections", keywords: "create add" },
];

function canSee(access: AccessLevel, permission: string | null): boolean {
  if (permission === null) return true;
  return access.isOwner || access.fullAccess || (access.permissions as readonly string[]).includes(permission);
}

const TYPE_ICON: Record<SearchResult["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  product: TShirt,
  order: ShoppingBag,
  category: Tag,
  collection: Package,
};

export default function CommandPalette({ access }: { access: AccessLevel }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard SSR-safe-portal mount flip
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onCustomOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onCustomOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: reset to a blank palette every time it's reopened, not a derivable value
    setQuery("");
    setResults([]);
    setSelected(0);
    // Focus after the portal actually paints, not on the same tick.
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: clears stale results the moment the query drops below the search threshold
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      const r = await searchAdminAction(query);
      setResults(r);
    }, 200);
    return () => clearTimeout(id);
  }, [query, open]);

  const filteredCommands = useMemo(() => {
    const visible = STATIC_COMMANDS.filter((c) => canSee(access, c.permission));
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q),
    );
  }, [access, query]);

  type Item =
    | { kind: "command"; command: StaticCommand }
    | { kind: "result"; result: SearchResult };
  const items: Item[] = useMemo(
    () => [
      ...filteredCommands.map((command) => ({ kind: "command" as const, command })),
      ...results.map((result) => ({ kind: "result" as const, result })),
    ],
    [filteredCommands, results],
  );

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[selected];
      if (!item) return;
      go(item.kind === "command" ? item.command.href : item.result.href);
    }
  }

  if (!mounted || !open) return null;

  const palette = (
    <div
      className="fixed inset-0 z-[150] flex justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-slate-950/55 dark:bg-black/45"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className={`relative h-fit max-h-[70vh] w-full max-w-xl overflow-hidden rounded-2xl border ${glassPanel}`}>
        <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 dark:border-slate-800">
          <MagnifyingGlass size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search products, orders, categories… or jump to a page"
            className="h-14 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block dark:border-slate-700 dark:text-slate-500">
            Esc
          </kbd>
        </div>

        <div className="max-h-[calc(70vh-56px)] overflow-y-auto py-2">
          {items.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              {query.trim().length >= 2 ? "No matches." : "Type to search, or pick a page below."}
            </p>
          )}
          {filteredCommands.length > 0 && (
            <div className="px-2 pb-1">
              <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Go to
              </p>
              {filteredCommands.map((c) => {
                const index = items.findIndex((it) => it.kind === "command" && it.command.id === c.id);
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => go(c.href)}
                    className={`flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm ${
                      selected === index
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
          {results.length > 0 && (
            <div className="px-2 pt-1">
              <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Results
              </p>
              {results.map((r, i) => {
                const index = items.findIndex((it) => it.kind === "result" && it.result === r);
                const Icon = TYPE_ICON[r.type];
                return (
                  <button
                    key={`${r.type}-${r.label}-${i}`}
                    type="button"
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => go(r.href)}
                    className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 text-start text-sm ${
                      selected === index
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    {r.sublabel && (
                      <span
                        className={`shrink-0 truncate text-xs ${
                          selected === index ? "text-white/70 dark:text-slate-900/60" : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {r.sublabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(palette, document.getElementById("admin-shell") ?? document.body);
}
