"use client";

import { useActionState, useEffect, useRef } from "react";

import type { ActionResult } from "@/src/domain/action-result";
import { createNoteAction } from "@/src/features/contacts/actions";

type ContactNoteFormProps = {
  contactId: string;
};

const initialState: ActionResult<{ noteId: string }> | null = null;

export function ContactNoteForm({ contactId }: ContactNoteFormProps) {
  const [state, formAction, isPending] = useActionState(createNoteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="contactId" value={contactId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-body" className="text-sm font-medium text-zinc-700">
          Add note
        </label>
        <textarea
          id="note-body"
          name="body"
          rows={4}
          required
          placeholder="Write a note for this contact…"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
        />
        {state?.ok === false && state.fieldErrors?.body ? (
          <p className="text-sm text-red-600">{state.fieldErrors.body[0]}</p>
        ) : null}
      </div>

      {state?.ok === false && state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Note saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}
