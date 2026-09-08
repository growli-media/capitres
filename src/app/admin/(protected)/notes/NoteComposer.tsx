"use client";

import { useActionState, useRef, useEffect } from "react";
import { createNoteAction, type FormState } from "./actions";
import { useActionToast } from "../components/useActionToast";
import { glassTextarea, glassButtonPrimary, glassTone } from "../../glass";

export default function NoteComposer() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createNoteAction, {});
  useActionToast(pending, state.error, "Note posted");
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) formRef.current?.reset();
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <textarea
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder="Write a note for the team…"
        className={glassTextarea}
      />
      {state.error && (
        <p role="alert" className={`rounded-lg px-4 py-3 text-sm font-medium ${glassTone.danger}`}>
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`flex h-10 cursor-pointer items-center px-5 text-sm font-semibold disabled:cursor-not-allowed ${glassButtonPrimary}`}
      >
        {pending ? "Posting…" : "Post note"}
      </button>
    </form>
  );
}
