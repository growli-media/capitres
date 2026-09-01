"use client";

import { useTransition } from "react";
import { useAdminToast } from "./AdminToastProvider";

/**
 * A single-button "form" that calls a server action directly (no fields
 * to collect) and fires the branded toast on success — for one-click
 * actions that would otherwise be a plain `<form action={fn}>` sitting
 * in a Server Component with no way to hook "it actually finished."
 */
export function ToastFormButton({
  action,
  toastMessage,
  toastTone,
  children,
  className,
  disabled,
  title,
}: {
  action: () => Promise<void>;
  toastMessage: string;
  toastTone?: "success" | "danger";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  const showToast = useAdminToast();

  return (
    <button
      type="button"
      title={title}
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          await action();
          showToast(toastMessage, toastTone);
        })
      }
      className={className}
    >
      {children}
    </button>
  );
}
