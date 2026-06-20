"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/src/domain/action-result";
import { createCallbackAction } from "../actions";
import type { CallbackAssigneeOption } from "../types";

type CallbackFormProps = {
  contactId: string;
  canAssignToOthers: boolean;
  assignableOperators: CallbackAssigneeOption[];
  disabled?: boolean;
  disabledMessage?: string | null;
};

const initialState: ActionResult<{ callbackId: string }> | null = null;

function defaultScheduledAtValue(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  date.setSeconds(0, 0);

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CallbackForm({
  contactId,
  canAssignToOthers,
  assignableOperators,
  disabled = false,
  disabledMessage = null,
}: CallbackFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createCallbackAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3" data-testid="callback-create-form">
      <input type="hidden" name="contactId" value={contactId} />

      {disabledMessage ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{disabledMessage}</p>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700">Termín</span>
        <input
          type="datetime-local"
          name="scheduledAt"
          required
          defaultValue={defaultScheduledAtValue()}
          disabled={disabled || isPending}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="callback-scheduled-at-input"
        />
        {state?.ok === false && state.fieldErrors?.scheduledAt ? (
          <p className="text-sm text-red-600">{state.fieldErrors.scheduledAt[0]}</p>
        ) : null}
      </label>

      {canAssignToOthers ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Operátor</span>
          <select
            name="assignedUserId"
            disabled={disabled || isPending}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="callback-assignee-select"
          >
            <option value="">Mně</option>
            {assignableOperators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.name ?? operator.email}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700">Poznámka</span>
        <textarea
          name="note"
          rows={2}
          disabled={disabled || isPending}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="Volitelná poznámka k callbacku…"
          data-testid="callback-note-input"
        />
      </label>

      {state?.ok === false && state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" data-testid="callback-create-success">
          Callback byl naplánován.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || isPending}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="callback-create-submit"
      >
        {isPending ? "Ukládám…" : "Naplánovat callback"}
      </button>
    </form>
  );
}
