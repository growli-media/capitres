import { setUserFullAccessAction } from "./actions";

/** Single source of truth for the two accounts that get an identity
 * badge next to their name in the team roster — DB emails are always
 * normalized lower-case (see normalizeEmail in users.ts), so a plain
 * `===` against these is safe. */
export const GROWLI_ADMIN_EMAIL = "hasan@growli.media";
export const CAPITRES_OFFICIAL_EMAIL = "capitresoficial@gmail.com";

const chipBase = "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all";

/**
 * Server-renderable (no "use client" — this lives inside the already
 * server-rendered TeamTable). Two special cases:
 *
 * - Growli's own email gets the agency's "G" mark on a solid navy chip
 *   (the SVG is white-fill/dark-stroke, so it needs a dark backing to
 *   read at all against a light-mode row) — and that chip IS this
 *   account's full-access toggle when `canToggle` (a strict-owner
 *   viewer): clicking it flips full_access. For anyone else it renders
 *   the same visual as a static, non-interactive badge.
 * - Capitres' own email gets a plain "C" monogram placeholder — a
 *   stand-in until the real Capitres logo asset is provided; swap the
 *   inner span for an <img> once it arrives, same pattern as the G mark.
 */
export default function TeamIdentityBadge({
  email,
  userId,
  fullAccess,
  canToggle,
}: {
  email: string;
  userId: string;
  fullAccess: boolean;
  canToggle: boolean;
}) {
  if (email === GROWLI_ADMIN_EMAIL) {
    const visual = (
      <span
        className={`${chipBase} bg-[#1B3445] ${fullAccess ? "opacity-100 ring-2 ring-[#8FC7EF] ring-offset-1 ring-offset-white dark:ring-offset-slate-900" : "opacity-50 grayscale"}`}
        title={fullAccess ? "Growli Media — full access on" : "Growli Media — full access off"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size mark, next/image is overkill */}
        <img src="/brand/growli-g-mark.svg" alt="" className="h-3.5 w-3.5" />
      </span>
    );
    if (!canToggle) return visual;
    return (
      <form action={setUserFullAccessAction.bind(null, userId, !fullAccess)}>
        <button
          type="submit"
          className="cursor-pointer rounded-full"
          aria-label={fullAccess ? "Turn off Growli full access" : "Turn on Growli full access"}
          aria-pressed={fullAccess}
        >
          {visual}
        </button>
      </form>
    );
  }

  if (email === CAPITRES_OFFICIAL_EMAIL) {
    return (
      <span
        className={`${chipBase} border border-slate-300 bg-slate-100 text-[10px] font-bold text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300`}
        title="Capitres"
      >
        C
      </span>
    );
  }

  return null;
}
