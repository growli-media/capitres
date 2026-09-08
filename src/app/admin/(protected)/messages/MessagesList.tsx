"use client";

import { useState } from "react";
import Modal from "../components/Modal";
import { glassCard } from "../../glass";

interface ContactMessage {
  id: number;
  createdAt: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

function subjectLabel(subject: string): string {
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesList({ messages }: { messages: ContactMessage[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = messages.find((m) => m.id === openId) ?? null;

  return (
    <>
      {/* Mobile: stacked cards, no horizontal scroll */}
      <div className="mt-6 space-y-3 md:hidden">
        {messages.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOpenId(m.id)}
            className={`block w-full p-4 text-start ${glassCard}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{m.email}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                {formatDate(m.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {subjectLabel(m.subject)}
            </p>
            <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-slate-600 dark:text-slate-400">
              {m.message}
            </p>
          </button>
        ))}
      </div>

      {/* Desktop: table */}
      <div className={`mt-6 hidden overflow-hidden md:block ${glassCard}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <th className="px-4 py-3 text-start font-medium whitespace-nowrap">From</th>
                <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Subject</th>
                <th className="px-4 py-3 text-start font-medium">Message</th>
                <th className="px-4 py-3 text-start font-medium whitespace-nowrap">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {messages.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setOpenId(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setOpenId(m.id);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open message from ${m.name}`}
                  className="cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 dark:hover:bg-slate-800/40 dark:focus-visible:bg-slate-800/40"
                >
                  <td className="max-w-48 px-4 py-3 whitespace-nowrap">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {subjectLabel(m.subject)}
                  </td>
                  <td className="min-w-60 max-w-sm px-4 py-3 text-slate-600 dark:text-slate-400">
                    <p className="line-clamp-2 whitespace-pre-line">{m.message}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {formatDate(m.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open !== null} onClose={() => setOpenId(null)} title={open?.name ?? ""} size="lg">
        {open && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400">
              <a href={`mailto:${open.email}`} className="hover:underline">
                {open.email}
              </a>
              <span aria-hidden="true">·</span>
              <span>{subjectLabel(open.subject)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(open.createdAt)}</span>
            </div>
            <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">{open.message}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
