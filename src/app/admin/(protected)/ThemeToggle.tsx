"use client";

import { Sun, Moon } from "@phosphor-icons/react";
import { glassIconButton } from "../glass";

export default function ThemeToggle({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className={`h-9 w-9 cursor-pointer ${glassIconButton}`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
