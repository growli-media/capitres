"use client";

import ThemeToggleIcon from "./ThemeToggleIcon";
import { glassIconButton } from "../glass";

export default function ThemeToggle({
  dark,
  onToggle,
  className,
}: {
  dark: boolean;
  onToggle: () => void;
  /** Overrides the default floating-button styling — used when this
   * renders inline inside the sidebar, which wants the sidebar's own
   * pill styling instead of glassIconButton's. */
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className={className ?? `h-9 w-9 cursor-pointer ${glassIconButton}`}
    >
      <ThemeToggleIcon dark={dark} />
    </button>
  );
}
