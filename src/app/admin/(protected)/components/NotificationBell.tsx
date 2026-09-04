"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "@phosphor-icons/react";
import { listRecentActivityAction } from "../notifications-actions";
import type { ActivityEntry } from "@/lib/admin/activity";
import { glassPanel, glassIconButton } from "../../glass";

const LAST_SEEN_KEY = "capitres-admin-last-seen-activity";
const POLL_MS = 20000;

/** Messages are written to stand alone ("Updated category \"Tees\"") —
 * lowercase the first letter when prefixing the actor's name so the
 * combined line reads as one sentence ("Hasan updated category…"). */
function lowercaseFirst(s: string): string {
  return s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/**
 * Bell icon + dropdown reading the same admin_activity_log every
 * mutating action already writes to (see activity.ts). Portals the
 * panel to #admin-shell instead of a plain `position: absolute` inside
 * the sidebar — the sidebar <aside> has its own `overflow-hidden` (for
 * its collapse-width slide animation), which would silently clip a
 * dropdown positioned relative to something inside it. Same lesson as
 * the admin tables' "More actions" menu fix.
 */
export default function NotificationBell({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: standard SSR-safe-portal mount flip
    setMounted(true);
    try {
      setLastSeenId(localStorage.getItem(LAST_SEEN_KEY));
    } catch {
      // Private browsing / storage blocked — every entry just reads as unread.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const rows = await listRecentActivityAction(20);
      if (!cancelled) setEntries(rows);
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next && entries[0]) {
        try {
          localStorage.setItem(LAST_SEEN_KEY, entries[0].id);
        } catch {
          // Storage blocked — unread count just won't persist across reloads.
        }
        setLastSeenId(entries[0].id);
      }
      return next;
    });
  }

  const unreadCount = lastSeenId
    ? entries.filter((e) => e.id > lastSeenId).length
    : entries.length > 0
      ? entries.length
      : 0;

  return (
    <>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        className={`relative h-8 w-8 shrink-0 ${className ?? glassIconButton}`}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {mounted &&
        open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[140]" onClick={() => setOpen(false)} aria-hidden="true" />
            <div
              className={`fixed top-20 start-4 z-[141] max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border md:start-[18.5rem] ${glassPanel}`}
            >
              <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
              </div>
              <div className="max-h-[calc(70vh-49px)] overflow-y-auto">
                {entries.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    Nothing yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {entries.map((e) => (
                      <li key={e.id} className="px-4 py-2.5 text-sm">
                        <p className="text-slate-700 dark:text-slate-300">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{e.actorName}</span>{" "}
                          {lowercaseFirst(e.message)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {relativeTime(e.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>,
          document.getElementById("admin-shell") ?? document.body,
        )}
    </>
  );
}
