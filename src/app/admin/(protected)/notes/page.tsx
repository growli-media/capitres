import type { Metadata } from "next";
import { NotePencil } from "@phosphor-icons/react/dist/ssr";
import { requireUserSession } from "@/lib/admin/auth";
import { listNotes, listDeletedNotes } from "@/lib/admin/notes";
import NoteComposer from "./NoteComposer";
import NoteCard from "./NoteCard";
import RecentlyDeletedNotes from "./RecentlyDeletedNotes";
import { glassCard, glassTone } from "../../glass";

export const metadata: Metadata = { title: "Notes" };

/** No requirePermission() call, deliberately — see AdminNav.tsx's
 * `permission: null` entry for this page: a notice board only works if
 * the whole team can see it, so it isn't a grantable/hideable permission.
 * requireUserSession() is nullable (not a redirect — see
 * src/lib/admin/auth.ts:188), so the page still renders for the legacy
 * shared login (already authenticated via the (protected) layout), just
 * without a composer or any edit/delete/reply/check controls, same
 * pattern as team/page.tsx. */
export default async function AdminNotesPage() {
  const session = await requireUserSession();
  const notes = await listNotes();

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const deletedNotes = session
    ? (await listDeletedNotes(sixtyDaysAgo)).filter((n) => n.authorId === session.id)
    : [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Notes</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Shared with the whole team — post a note, reply, and mark it checked once you&apos;ve seen it.
      </p>

      {!session && (
        <p className={`mt-6 rounded-lg px-4 py-3 text-sm font-medium ${glassTone.warning}`}>
          Sign in with your own named account (not the shared login) to post, reply, or check off notes.
        </p>
      )}

      {session && (
        <div className={`mt-6 p-4 ${glassCard}`}>
          <NoteComposer />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
            <NotePencil size={28} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No notes yet.</p>
          </div>
        ) : (
          notes.map((note) => <NoteCard key={note.id} note={note} viewerId={session?.id ?? null} />)
        )}
      </div>

      {session && deletedNotes.length > 0 && <RecentlyDeletedNotes notes={deletedNotes} />}
    </div>
  );
}
