"use client";

import { useActionState, useRef, useEffect } from "react";
import { createReplyAction, type FormState } from "./actions";
import { useActionToast } from "../components/useActionToast";
import { glassTextarea, glassButtonSecondary, glassTone } from "../../glass";

export default function ReplyComposer({ noteId }: { noteId: string }) {
  const boundAction = createReplyAction.bind(null, noteId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(boundAction, {});
  useActionToast(pending, state.error, "Reply posted");
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) formRef.current?.reset();
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="mt-2 space-y-2">
      <textarea
        name="body"
        required
        rows={2}
        maxLength={2000}
        placeholder="Reply…"
        className={`${glassTextarea} text-sm`}
      />
      {state.error && (
        <p role="alert" className={`rounded-lg px-3 py-2 text-xs font-medium ${glassTone.danger}`}>
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`flex h-8 cursor-pointer items-center px-3 text-xs font-semibold disabled:cursor-not-allowed ${glassButtonSecondary}`}
      >
        {pending ? "Posting…" : "Reply"}
      </button>
    </form>
  );
}
