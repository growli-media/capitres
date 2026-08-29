import type { Metadata } from "next";
import { requireUserSession } from "@/lib/admin/auth";
import { listAllowlist } from "@/lib/admin/allowlist";
import { listUsers, getUserById } from "@/lib/admin/users";
import { removeEmailAction, setUserDisabledAction } from "./actions";
import AddEmailForm from "./AddEmailForm";
import EditProfileForm from "./EditProfileForm";
import EditPermissionsButton from "./EditPermissionsButton";
import { glassCard, glassTone } from "../../glass";

export const metadata: Metadata = { title: "Team" };

function statusLabel(entry: { hasAccount: boolean; totpEnabled: boolean; disabled: boolean }) {
  if (!entry.hasAccount)
    return { text: "Approved — not signed up yet", cls: glassTone.neutral };
  if (entry.disabled) return { text: "Disabled", cls: glassTone.danger };
  if (!entry.totpEnabled)
    return { text: "Signed up — 2FA incomplete", cls: glassTone.warning };
  return { text: "Active", cls: glassTone.success };
}

export default async function TeamPage() {
  const session = await requireUserSession();
  const currentUser = session ? await getUserById(session.id) : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Team</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {currentUser?.isOwner
          ? "Only approved emails can sign up for an admin account."
          : "Your own profile — ask the account owner to change what you can access."}
      </p>

      {!session && (
        <div className={`mt-6 rounded-xl border border-amber-200 p-4 text-sm dark:border-amber-900/50 ${glassTone.warning}`}>
          You&rsquo;re signed in with the legacy admin password. Sign up or sign
          in with your own account to manage team access.
        </div>
      )}

      {/* Non-owners only see their own profile — no visibility into the
          rest of the team, allowlist, or anyone else's access. */}
      {session && currentUser && !currentUser.isOwner && (
        <div className={`mt-6 max-w-md p-5 ${glassCard}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {[currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") || currentUser.email}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
              {currentUser.role && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentUser.role}</p>
              )}
              {currentUser.company && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.company}</p>
              )}
            </div>
            <EditProfileForm
              firstName={currentUser.firstName}
              lastName={currentUser.lastName}
              phone={currentUser.phone}
              role={currentUser.role}
              company={currentUser.company}
              email={currentUser.email}
            />
          </div>
        </div>
      )}

      {session && currentUser?.isOwner && (
        <>
          <AddEmailForm />

          <TeamTable ownerId={currentUser.id} />
        </>
      )}
    </div>
  );
}

async function TeamTable({ ownerId }: { ownerId: string }) {
  const allowlist = await listAllowlist();
  const users = await listUsers();

  return (
    <div className={`mt-8 overflow-hidden ${glassCard}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <th className="px-4 py-3 text-start font-medium">Name</th>
            <th className="px-4 py-3 text-start font-medium">Email</th>
            <th className="px-4 py-3 text-start font-medium">Role</th>
            <th className="px-4 py-3 text-start font-medium">Company</th>
            <th className="px-4 py-3 text-start font-medium">Phone</th>
            <th className="px-4 py-3 text-start font-medium">Status</th>
            <th className="px-4 py-3 text-start font-medium">Access</th>
            <th className="px-4 py-3 text-end font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {allowlist.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No approved emails yet.
              </td>
            </tr>
          )}
          {allowlist.map((entry) => {
            const status = statusLabel(entry);
            const user = users.find((u) => u.email === entry.email);
            const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
            const isSelf = user?.id === ownerId;
            return (
              <tr key={entry.email}>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{fullName || "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{entry.email}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user?.role || "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user?.company || "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400" dir="ltr">
                  {user?.phone || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                    {status.text}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!user ? (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  ) : user.isOwner ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.info}`}>
                      Owner — full access
                    </span>
                  ) : (
                    <EditPermissionsButton
                      userId={user.id}
                      name={fullName || user.email}
                      permissions={user.permissions}
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {isSelf && user && (
                      <EditProfileForm
                        firstName={user.firstName}
                        lastName={user.lastName}
                        phone={user.phone}
                        role={user.role}
                        company={user.company}
                        email={user.email}
                      />
                    )}
                    {user && (
                      <form action={setUserDisabledAction.bind(null, user.id, !user.disabled)}>
                        <button
                          type="submit"
                          disabled={isSelf}
                          className="rounded-full border border-slate-300/70 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-md transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800/70"
                          title={isSelf ? "You can't disable your own account" : undefined}
                        >
                          {user.disabled ? "Enable" : "Disable"}
                        </button>
                      </form>
                    )}
                    <form action={removeEmailAction.bind(null, entry.email)}>
                      <button
                        type="submit"
                        className="rounded-full border border-slate-300/70 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-500 backdrop-blur-md transition-colors hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800/70"
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
  );
}
