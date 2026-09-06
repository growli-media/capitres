import type { Metadata } from "next";
import { Envelope } from "@phosphor-icons/react/dist/ssr";
import { requirePermission } from "@/lib/admin/permissions";
import { listRecords } from "@/lib/server/records";
import { glassCard } from "../../glass";

export const metadata: Metadata = { title: "Messages" };

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale?: string;
}

function asContact(payload: Record<string, unknown>): ContactPayload {
  return {
    name: typeof payload.name === "string" ? payload.name : "—",
    email: typeof payload.email === "string" ? payload.email : "—",
    subject: typeof payload.subject === "string" ? payload.subject : "other",
    message: typeof payload.message === "string" ? payload.message : "",
    locale: typeof payload.locale === "string" ? payload.locale : undefined,
  };
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

export default async function AdminMessagesPage() {
  await requirePermission("contact_messages");
  const records = await listRecords("contact");
  const messages = records.map((r) => ({ id: r.id, createdAt: r.createdAt, ...asContact(r.payload) }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Messages</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Submissions from the storefront&apos;s contact form — also emailed as they come in.
      </p>

      {messages.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <Envelope size={28} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="mt-6 space-y-3 md:hidden">
            {messages.map((m) => (
              <div key={m.id} className={`p-4 ${glassCard}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
                    <a
                      href={`mailto:${m.email}`}
                      className="truncate text-xs text-slate-500 hover:underline dark:text-slate-400"
                    >
                      {m.email}
                    </a>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(m.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {subjectLabel(m.subject)}
                </p>
                <p className="mt-1 text-sm whitespace-pre-line text-slate-600 dark:text-slate-400">{m.message}</p>
              </div>
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
                    <tr key={m.id}>
                      <td className="max-w-48 px-4 py-3 whitespace-nowrap">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
                        <a
                          href={`mailto:${m.email}`}
                          className="truncate text-xs text-slate-500 hover:underline dark:text-slate-400"
                        >
                          {m.email}
                        </a>
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
        </>
      )}
    </div>
  );
}
