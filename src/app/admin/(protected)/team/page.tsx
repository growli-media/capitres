import type { Metadata } from "next";
import { requireUserSession } from "@/lib/admin/auth";
import { listAllowlist } from "@/lib/admin/allowlist";
import { listUsers } from "@/lib/admin/users";
import { removeEmailAction, setUserDisabledAction } from "./actions";
import AddEmailForm from "./AddEmailForm";
import EditProfileForm from "./EditProfileForm";

export const metadata: Metadata = { title: "Team" };

function statusLabel(entry: { hasAccount: boolean; totpEnabled: boolean; disabled: boolean }) {
  if (!entry.hasAccount)
    return { text: "Approved — not signed up yet", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
  if (entry.disabled) return { text: "Disabled", cls: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" };
  if (!entry.totpEnabled)
    return { text: "Signed up — 2FA incomplete", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" };
  return { text: "Active", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" };
}

export default async function TeamPage() {
  const session = await requireUserSession();
  const allowlist = await listAllowlist();
  const users = session ? await listUsers() : [];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Team</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Only approved emails can sign up for an admin account.
      </p>

      {!session && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          You&rsquo;re signed in with the legacy admin password. Sign up or sign
          in with your own account to manage team access.
        </div>
      )}

      {session && (
        <>
          <AddEmailForm />

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="px-4 py-3 text-start font-medium">Name</th>
                  <th className="px-4 py-3 text-start font-medium">Email</th>
                  <th className="px-4 py-3 text-start font-medium">Role</th>
                  <th className="px-4 py-3 text-start font-medium">Phone</th>
                  <th className="px-4 py-3 text-start font-medium">Status</th>
                  <th className="px-4 py-3 text-end font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allowlist.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No approved emails yet.
                    </td>
                  </tr>
                )}
                {allowlist.map((entry) => {
                  const status = statusLabel(entry);
                  const user = users.find((u) => u.email === entry.email);
                  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
                  const isSelf = !!user && session.id === user.id;
                  return (
                    <tr key={entry.email}>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{fullName || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{entry.email}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user?.role || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400" dir="ltr">
                        {user?.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {isSelf && (
                            <EditProfileForm
                              firstName={user.firstName}
                              lastName={user.lastName}
                              phone={user.phone}
                              role={user.role}
                              email={user.email}
                            />
                          )}
                          {user && (
                            <form action={setUserDisabledAction.bind(null, user.id, !user.disabled)}>
                              <button
                                type="submit"
                                disabled={session.id === user.id}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                title={session.id === user.id ? "You can't disable your own account" : undefined}
                              >
                                {user.disabled ? "Enable" : "Disable"}
                              </button>
                            </form>
                          )}
                          <form action={removeEmailAction.bind(null, entry.email)}>
                            <button
                              type="submit"
                              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                              Remove
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
