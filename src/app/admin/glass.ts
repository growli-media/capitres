/**
 * Shared "liquid glass" primitives for the admin dashboard — translucent,
 * blurred surfaces replacing the earlier flat slate/white design. Works
 * in both light and dark (the .admin-dark scoping from earlier this
 * session is untouched — see globals.css's @custom-variant). Auth pages
 * (login/signup/etc, outside (protected)/) use these too, which is why
 * this file lives at src/app/admin/ rather than nested under (protected)/.
 */

/** The inset top highlight on both surfaces below is a thin catch-light
 * line simulating a glass edge — the "reflecting" quality asked for,
 * kept subtle so it reads as a material property, not a stripe. */
export const glassCard =
  "rounded-2xl border border-white/40 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_30px_rgb(0,0,0,0.35)]";

/** Higher opacity than glassCard — for surfaces that sit over scrolling
 * page content (sidebar, modal) where text legibility matters more than
 * showing what's behind it. */
/** Color-only border, no width utility — callers set their own directional
 * width (border-e on the sidebar, border-b on the top bar, plain `border`
 * for the modal, since they each want different sides). */
export const glassPanel =
  "border-white/40 bg-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_30px_rgb(0,0,0,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_30px_rgb(0,0,0,0.4)]";

/** Sidebar only — Growli's own brand navy (see globals.css's
 * .sidebar-glass-bg for the gradient itself and why it doesn't switch
 * with the admin light/dark toggle). Same glass structure as glassPanel
 * (soft border, inset light edge, blur) just recolored for a permanently
 * dark surface, so sidebar text/icons need light-on-navy treatment, not
 * the slate-on-white glassPanel assumes. */
export const sidebarGlass = "sidebar-glass-bg border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl";

/** No height/width/padding baked in — callers vary (h-10 + px-3 in most
 * dashboard forms, h-11 + px-3.5 on the auth pages, textareas want
 * h-auto + py-2) so every caller sets its own sizing alongside this. */
export const glassInput =
  "rounded-lg border border-slate-300/70 bg-white/60 text-sm text-slate-900 outline-none backdrop-blur-md transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100/60 disabled:text-slate-500 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400/10 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-400";

/** Fully self-contained (unlike glassInput) — textarea sizing barely
 * varies across the codebase, so this is convenient as-is. */
export const glassTextarea = `w-full resize-none px-3 py-2 ${glassInput}`;

/** Pill-shaped (rounded-full), with a visible outline border and a
 * stronger blur than the card/panel surfaces — buttons are small and sit
 * directly over moving background content, so they need more blur to
 * read as glass rather than a flat tint. Top-to-bottom gradient (lighter
 * at the top edge, fading toward the base) plus an inset highlight line
 * on the top edge itself read as a glass surface catching light from
 * above, i.e. the "reflecting" look. */
export const glassButtonPrimary =
  "rounded-full border border-white/20 bg-gradient-to-b from-slate-700 to-slate-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_14px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_18px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:hover:brightness-100 dark:border-white/10 dark:from-white dark:to-slate-200 dark:text-slate-900 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_14px_rgba(0,0,0,0.35)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_18px_rgba(0,0,0,0.4)]";

export const glassButtonSecondary =
  "rounded-full border border-white/60 bg-gradient-to-b from-white/70 to-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl transition-all hover:from-white/90 hover:to-white/40 dark:border-white/15 dark:from-white/20 dark:to-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:hover:from-white/30 dark:hover:to-white/10";

export const glassIconButton =
  "flex items-center justify-center rounded-full border border-white/40 text-slate-600 backdrop-blur-xl transition-all hover:bg-gradient-to-b hover:from-white/80 hover:to-white/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:text-slate-300 dark:hover:from-white/20 dark:hover:to-white/5 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]";

/** Tone-tinted pill/badge variants — same emerald/amber/red/blue palette
 * used across orders/reviews/team, now with a translucent glass base. */
export const glassTone = {
  neutral: "bg-slate-100/70 text-slate-600 backdrop-blur-sm dark:bg-slate-800/60 dark:text-slate-300",
  success: "bg-emerald-50/80 text-emerald-700 backdrop-blur-sm dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "bg-amber-50/80 text-amber-700 backdrop-blur-sm dark:bg-amber-950/40 dark:text-amber-300",
  danger: "bg-red-50/80 text-red-700 backdrop-blur-sm dark:bg-red-950/40 dark:text-red-300",
  info: "bg-blue-50/80 text-blue-700 backdrop-blur-sm dark:bg-blue-950/40 dark:text-blue-300",
} as const;
