/**
 * Shared "liquid glass" primitives for the admin dashboard — translucent,
 * blurred surfaces replacing the earlier flat slate/white design. Works
 * in both light and dark (the .admin-dark scoping from earlier this
 * session is untouched — see globals.css's @custom-variant). Auth pages
 * (login/signup/etc, outside (protected)/) use these too, which is why
 * this file lives at src/app/admin/ rather than nested under (protected)/.
 */

export const glassCard =
  "rounded-2xl border border-white/40 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)]";

/** Higher opacity than glassCard — for surfaces that sit over scrolling
 * page content (sidebar, modal) where text legibility matters more than
 * showing what's behind it. */
/** Color-only border, no width utility — callers set their own directional
 * width (border-e on the sidebar, border-b on the top bar, plain `border`
 * for the modal, since they each want different sides). */
export const glassPanel =
  "border-white/40 bg-white/75 shadow-[0_8px_30px_rgb(0,0,0,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]";

/** No height/width/padding baked in — callers vary (h-10 + px-3 in most
 * dashboard forms, h-11 + px-3.5 on the auth pages, textareas want
 * h-auto + py-2) so every caller sets its own sizing alongside this. */
export const glassInput =
  "rounded-lg border border-slate-300/70 bg-white/60 text-sm text-slate-900 outline-none backdrop-blur-md transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100/60 disabled:text-slate-500 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400/10 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-400";

/** Fully self-contained (unlike glassInput) — textarea sizing barely
 * varies across the codebase, so this is convenient as-is. */
export const glassTextarea = `w-full resize-none px-3 py-2 ${glassInput}`;

export const glassButtonPrimary =
  "rounded-lg bg-slate-900/90 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white";

export const glassButtonSecondary =
  "rounded-lg border border-slate-300/70 bg-white/50 backdrop-blur-md transition-colors hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:hover:bg-slate-800/70";

export const glassIconButton =
  "flex items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10";

/** Tone-tinted pill/badge variants — same emerald/amber/red/blue palette
 * used across orders/reviews/team, now with a translucent glass base. */
export const glassTone = {
  neutral: "bg-slate-100/70 text-slate-600 backdrop-blur-sm dark:bg-slate-800/60 dark:text-slate-300",
  success: "bg-emerald-50/80 text-emerald-700 backdrop-blur-sm dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "bg-amber-50/80 text-amber-700 backdrop-blur-sm dark:bg-amber-950/40 dark:text-amber-300",
  danger: "bg-red-50/80 text-red-700 backdrop-blur-sm dark:bg-red-950/40 dark:text-red-300",
  info: "bg-blue-50/80 text-blue-700 backdrop-blur-sm dark:bg-blue-950/40 dark:text-blue-300",
} as const;
