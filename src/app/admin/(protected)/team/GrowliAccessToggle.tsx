"use client";

import { useTransition } from "react";
import { setUserFullAccessAction } from "./actions";
import { useAdminToast } from "../components/AdminToastProvider";

/**
 * The interactive (canToggle) version of the Growli badge — a client
 * component specifically because the toast below needs to react to the
 * action actually completing, which a plain `<form action={...}>`
 * doesn't give a hook for. Calls the server action directly (same
 * pattern as every other range-scoped fetch in this app — see
 * DashboardView.tsx's startTransition + direct-await-server-action
 * usage) rather than submitting a form.
 */
export default function GrowliAccessToggle({
  userId,
  name,
  fullAccess,
  visual,
}: {
  userId: string;
  name: string;
  fullAccess: boolean;
  visual: React.ReactNode;
}) {
  const [, startTransition] = useTransition();
  const showToast = useAdminToast();

  function handleClick() {
    const next = !fullAccess;
    startTransition(async () => {
      await setUserFullAccessAction(userId, next);
      showToast(
        `Developer mode ${next ? "activated" : "deactivated"} for ${name}`,
        next ? "success" : "danger",
      );
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="cursor-pointer rounded-full"
      aria-label={fullAccess ? "Turn off Growli full access" : "Turn on Growli full access"}
      aria-pressed={fullAccess}
    >
      {visual}
    </button>
  );
}
