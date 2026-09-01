import { setUserFullAccessAction } from "./actions";

/** Single source of truth for the two accounts that get an identity
 * badge next to their name in the team roster — DB emails are always
 * normalized lower-case (see normalizeEmail in users.ts), so a plain
 * `===` against these is safe. */
export const GROWLI_ADMIN_EMAIL = "hasan@growli.media";
export const CAPITRES_OFFICIAL_EMAIL = "capitresoficial@gmail.com";

const chipBase = "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all";

/**
 * Server-renderable (no "use client" — this lives inside the already
 * server-rendered TeamTable). Two special cases:
 *
 * - Growli's own email is the full-access override toggle — currently a
 *   plain "G" monogram placeholder (navy chip) pending a real Growli
 *   logo asset (the first file provided turned out to be Capitres' own
 *   mark, not Growli's — see capitres-c-mark.svg below). Swap the inner
 *   span for an <img>, same pattern as Capitres', once the real one
 *   arrives. That chip IS this account's full-access toggle when
 *   `canToggle` (a strict-owner viewer): clicking it flips full_access.
 *   For anyone else it renders the same visual as a static,
 *   non-interactive badge.
 * - Capitres' own email gets their actual mark
 *   (public/brand/capitres-c-mark.svg) on a solid black chip, matching
 *   their storefront's stark black/white brand.
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
        className={`${chipBase} bg-[#1B3445] text-xs font-bold text-white ${fullAccess ? "opacity-100 ring-2 ring-[#8FC7EF] ring-offset-1 ring-offset-white dark:ring-offset-slate-900" : "opacity-50 grayscale"}`}
        title={fullAccess ? "Growli Media — full access on" : "Growli Media — full access off"}
      >
        G
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
      <span className={`${chipBase} bg-black`} title="Capitres">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size mark, next/image is overkill */}
        <img src="/brand/capitres-c-mark.svg" alt="" className="h-5 w-5" />
      </span>
    );
  }

  return null;
}
