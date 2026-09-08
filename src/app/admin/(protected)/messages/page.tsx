import type { Metadata } from "next";
import { Envelope } from "@phosphor-icons/react/dist/ssr";
import { requirePermission } from "@/lib/admin/permissions";
import { listRecords } from "@/lib/server/records";
import MessagesList from "./MessagesList";

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
        <MessagesList messages={messages} />
      )}
    </div>
  );
}
