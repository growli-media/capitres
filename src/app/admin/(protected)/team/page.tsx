import type { Metadata } from "next";
import { requireUserSession } from "@/lib/admin/auth";
import { hasFullControl } from "@/lib/admin/permissions";
import { listAllowlist, type AllowlistEntry } from "@/lib/admin/allowlist";
import { listUsers, getUserById, type AdminUser } from "@/lib/admin/users";
import { removeEmailAction, setUserDisabledAction, setUserFullAccessAction } from "./actions";
import AddEmailForm from "./AddEmailForm";
import EditProfileForm from "./EditProfileForm";
import EditPermissionsButton from "./EditPermissionsButton";
import TransferOwnershipButton from "./TransferOwnershipButton";
import TeamIdentityBadge, { GROWLI_ADMIN_EMAIL } from "./team-identity";
import { ToastFormButton } from "../components/ToastFormButton";
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
  const canManage = currentUser ? hasFullControl(currentUser) : false;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Team</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {canManage
          ? "Only approved emails can sign up for an admin account."
          : "Your own profile — ask the account owner to change what you can access."}
      </p>

      {!session && (
        <div className={`mt-6 rounded-xl border border-amber-200 p-4 text-sm dark:border-amber-900/50 ${glassTone.warning}`}>
          You&rsquo;re signed in with the legacy admin password. Sign up or sign
          in with your own account to manage team access.
        </div>
      )}

      {/* Non-owner, non-full-access viewers only see their own profile —
          no visibility into the rest of the team, allowlist, or anyone
          else's access. */}
      {session && currentUser && !canManage && (
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

      {session && currentUser && canManage && (
        <TeamManagement viewer={currentUser} />
      )}
    </div>
  );
}

async function TeamManagement({ viewer }: { viewer: AdminUser }) {
  const [allowlist, users] = await Promise.all([listAllowlist(), listUsers()]);
  const eligibleUsers = users
    .filter((u) => !u.isOwner && !u.disabled && u.totpEnabled && u.id !== viewer.id)
    .map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
      email: u.email,
    }));

  return (
    <>
      <AddEmailForm />
      {viewer.isOwner && <TransferOwnershipButton eligibleUsers={eligibleUsers} />}
      <TeamTable viewerId={viewer.id} viewerIsOwner={viewer.isOwner} allowlist={allowlist} users={users} />
    </>
  );
}

function TeamTable({
  viewerId,
  viewerIsOwner,
  allowlist,
  users,
}: {
  viewerId: string;
  viewerIsOwner: boolean;
  allowlist: AllowlistEntry[];
  users: AdminUser[];
}) {
  return (
    <>
      {/* Mobile: stacked cards, no horizontal scroll */}
      <div className="mt-8 space-y-3 md:hidden">
        {allowlist.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No approved emails yet.</p>
        )}
        {allowlist.map((entry) => {
          const status = statusLabel(entry);
          const user = users.find((u) => u.email === entry.email);
          const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
          const isSelf = user?.id === viewerId;
          return (
            <div key={entry.email} className={`p-4 ${glassCard}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {user && (
                    <TeamIdentityBadge
                      email={user.email}
                      userId={user.id}
                      name={fullName || user.email}
                      fullAccess={user.fullAccess}
                      canToggle={viewerIsOwner}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fullName || entry.email}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{entry.email}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                  {status.text}
                </span>
              </div>
              {(user?.role || user?.company || user?.phone) && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {[user?.role, user?.company, user?.phone].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!user ? null : user.isOwner ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${glassTone.info}`}>
                    Owner — full access
                  </span>
                ) : (
                  <>
                    <EditPermissionsButton
                      userId={user.id}
                      name={fullName || user.email}
                      permissions={user.permissions}
                    />
                    {user.email !== GROWLI_ADMIN_EMAIL && (
                      <ToastFormButton
                        action={setUserFullAccessAction.bind(null, user.id, !user.fullAccess)}
                        toastMessage={`Full access ${user.fullAccess ? "revoked from" : "granted to"} ${fullName || user.email}`}
                        toastTone={user.fullAccess ? "danger" : "success"}
                        disabled={!viewerIsOwner}
                        title={!viewerIsOwner ? "Only the owner can change full access" : undefined}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap backdrop-blur-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          user.fullAccess
                            ? glassTone.info
                            : "border border-slate-300/70 bg-white/50 text-slate-700 hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800/70"
                        }`}
                      >
                        {user.fullAccess ? "Full access: On" : "Grant full access"}
                      </ToastFormButton>
                    )}
                  </>
                )}
                {user && (isSelf || !user.isOwner) && (
                  <EditProfileForm
                    firstName={user.firstName}
                    lastName={user.lastName}
                    phone={user.phone}
                    role={user.role}
                    company={user.company}
                    email={user.email}
                    targetUserId={isSelf ? undefined : user.id}
                    targetName={isSelf ? undefined : fullName || user.email}
                  />
                )}
                {user && (
                  <ToastFormButton
                    action={setUserDisabledAction.bind(null, user.id, !user.disabled)}
                    toastMessage={`${fullName || user.email} ${user.disabled ? "enabled" : "disabled"}`}
                    toastTone={user.disabled ? "success" : "danger"}
                    disabled={isSelf || user.isOwner}
                    className="rounded-full border border-slate-300/70 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-md transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800/70"
                    title={isSelf ? "You can't disable your own account" : undefined}
                  >
                    {user.disabled ? "Enable" : "Disable"}
                  </ToastFormButton>
                )}
                <ToastFormButton
                  action={removeEmailAction.bind(null, entry.email)}
                  toastMessage={`${entry.email} removed`}
                  toastTone="danger"
                  className="rounded-full border border-slate-300/70 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-500 backdrop-blur-md transition-colors hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800/70"
                >
                  Remove
                </ToastFormButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table — compact padding/type tuned so all 8 columns fit
          at typical desktop widths without any scrolling (the wide
          1600px content container in AdminShell.tsx helps too), which is
          what was actually asked for: a horizontally-scrolling table read
          as "not really responsive." overflow-x-auto stays as a safety
          net for anything still narrower than expected. */}
      <div className={`mt-8 hidden overflow-hidden md:block ${glassCard}`}>
      <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <th className="px-2.5 py-2 text-start font-medium">Name</th>
            <th className="px-2.5 py-2 text-start font-medium">Email</th>
            <th className="px-2.5 py-2 text-start font-medium">Role</th>
            <th className="px-2.5 py-2 text-start font-medium">Company</th>
            <th className="px-2.5 py-2 text-start font-medium">Phone</th>
            <th className="px-2.5 py-2 text-start font-medium">Status</th>
            <th className="px-2.5 py-2 text-start font-medium">Access</th>
            <th className="px-2.5 py-2 text-end font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {allowlist.length === 0 && (
            <tr>
              <td colSpan={8} className="px-2.5 py-8 text-center text-slate-500 dark:text-slate-400">
                No approved emails yet.
              </td>
            </tr>
          )}
          {allowlist.map((entry) => {
            const status = statusLabel(entry);
            const user = users.find((u) => u.email === entry.email);
            const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
            const isSelf = user?.id === viewerId;
            return (
              <tr key={entry.email}>
                <td className="px-2.5 py-2 font-medium text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    {user && (
                      <TeamIdentityBadge
                        email={user.email}
                        userId={user.id}
                        name={fullName || user.email}
                        fullAccess={user.fullAccess}
                        canToggle={viewerIsOwner}
                      />
                    )}
                    <span>{fullName || "—"}</span>
                  </div>
                </td>
                <td className="px-2.5 py-2 text-slate-600 dark:text-slate-400">{entry.email}</td>
                <td className="px-2.5 py-2 text-slate-600 dark:text-slate-400">{user?.role || "—"}</td>
                <td className="px-2.5 py-2 text-slate-600 dark:text-slate-400">{user?.company || "—"}</td>
                <td className="px-2.5 py-2 text-slate-600 dark:text-slate-400" dir="ltr">
                  {user?.phone || "—"}
                </td>
                <td className="px-2.5 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${status.cls}`}>
                    {status.text}
                  </span>
                </td>
                <td className="px-2.5 py-2">
                  {!user ? (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  ) : user.isOwner ? (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${glassTone.info}`}>
                      Owner — full access
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      <EditPermissionsButton
                        userId={user.id}
                        name={fullName || user.email}
                        permissions={user.permissions}
                      />
                      {user.email !== GROWLI_ADMIN_EMAIL && (
                        <ToastFormButton
                          action={setUserFullAccessAction.bind(null, user.id, !user.fullAccess)}
                          toastMessage={`Full access ${user.fullAccess ? "revoked from" : "granted to"} ${fullName || user.email}`}
                          toastTone={user.fullAccess ? "danger" : "success"}
                          disabled={!viewerIsOwner}
                          title={!viewerIsOwner ? "Only the owner can change full access" : undefined}
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap backdrop-blur-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            user.fullAccess
                              ? glassTone.info
                              : "border border-slate-300/70 bg-white/50 text-slate-700 hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          {user.fullAccess ? "Full access: On" : "Grant full access"}
                        </ToastFormButton>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-2.5 py-2">
                  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                    {user && (isSelf || !user.isOwner) && (
                      <EditProfileForm
                        firstName={user.firstName}
                        lastName={user.lastName}
                        phone={user.phone}
                        role={user.role}
                        company={user.company}
                        email={user.email}
                        targetUserId={isSelf ? undefined : user.id}
                        targetName={isSelf ? undefined : fullName || user.email}
                      />
                    )}
                    {user && (
                      <ToastFormButton
                        action={setUserDisabledAction.bind(null, user.id, !user.disabled)}
                        toastMessage={`${fullName || user.email} ${user.disabled ? "enabled" : "disabled"}`}
                        toastTone={user.disabled ? "success" : "danger"}
                        disabled={isSelf || user.isOwner}
                        className="rounded-full border border-slate-300/70 bg-white/50 px-2 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur-md transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800/70"
                        title={isSelf ? "You can't disable your own account" : undefined}
                      >
                        {user.disabled ? "Enable" : "Disable"}
                      </ToastFormButton>
                    )}
                    <ToastFormButton
                      action={removeEmailAction.bind(null, entry.email)}
                      toastMessage={`${entry.email} removed`}
                      toastTone="danger"
                      className="rounded-full border border-slate-300/70 bg-white/50 px-2 py-1 text-[11px] font-semibold text-slate-500 backdrop-blur-md transition-colors hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800/70"
                    >
                      Remove
                    </ToastFormButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      </div>
    </>
  );
}
