"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "./actions";
import { glassTextarea, glassButtonPrimary, glassButtonSecondary, glassTone } from "../../glass";

/** Shared edit-in-place form for both a note and a reply — bind the
 * update action to its id at the call site (updateNoteAction.bind(null,
 * id) or updateReplyAction.bind(null, id)). */
export default function InlineEditor({
  action,
  initialBody,
  onDone,
  compact,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initialBody: string;
  onDone: () => void;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onDone();
    wasPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <textarea
        name="body"
        required
        defaultValue={initialBody}
        rows={compact ? 2 : 3}
        maxLength={2000}
        className={`${glassTextarea} ${compact ? "text-sm" : ""}`}
        autoFocus
      />
      {state.error && (
        <p role="alert" className={`rounded-lg px-3 py-2 text-xs font-medium ${glassTone.danger}`}>
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={`flex ${compact ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm"} cursor-pointer items-center font-semibold disabled:cursor-not-allowed ${glassButtonPrimary}`}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className={`flex ${compact ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm"} cursor-pointer items-center font-medium text-slate-600 dark:text-slate-300 ${glassButtonSecondary}`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
