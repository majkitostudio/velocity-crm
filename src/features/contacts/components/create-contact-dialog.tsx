"use client";

import { useActionState, useRef } from "react";

import type { ActionResult } from "@/src/domain/action-result";

import { createContactAction } from "../actions";
import type { ContactListAssigneeOption } from "../types";

type CreateContactDialogProps = {
  returnTo: string;
  canManageAssignments: boolean;
  assignableOperators: ContactListAssigneeOption[];
};

const initialState: ActionResult<{ contactId: string }> | null = null;

function FieldError({
  state,
  field,
}: {
  state: ActionResult<{ contactId: string }> | null;
  field: string;
}) {
  if (!state || state.ok || !state.fieldErrors?.[field]?.[0]) {
    return null;
  }

  return <p className="text-sm text-red-600">{state.fieldErrors[field][0]}</p>;
}

export function CreateContactDialog({
  returnTo,
  canManageAssignments,
  assignableOperators,
}: CreateContactDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState(createContactAction, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
        data-testid="create-contact-open-button"
      >
        Nový kontakt
      </button>

      <dialog
        ref={dialogRef}
        className="w-[min(100%,32rem)] rounded-xl border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-zinc-900/40"
        data-testid="create-contact-dialog"
      >
        <form action={formAction} className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Nový kontakt</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Rychlé vytvoření leadu pro další práci v CRM.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Zavřít"
            >
              ×
            </button>
          </div>

          <input type="hidden" name="returnTo" value={returnTo} />

          {state?.ok === false && state.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="create-contact-error">
              {state.error}
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Jméno</span>
            <input
              type="text"
              name="name"
              required
              autoFocus
              disabled={isPending}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="create-contact-name-input"
            />
            <FieldError state={state} field="name" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Telefon</span>
            <input
              type="tel"
              name="phone"
              required
              placeholder="+420601123456"
              disabled={isPending}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="create-contact-phone-input"
            />
            <FieldError state={state} field="phone" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">E-mail</span>
            <input
              type="email"
              name="email"
              disabled={isPending}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="create-contact-email-input"
            />
            <FieldError state={state} field="email" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Priorita</span>
            <select
              name="priority"
              defaultValue="NORMAL"
              disabled={isPending}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="create-contact-priority-select"
            >
              <option value="HIGH">Vysoká</option>
              <option value="NORMAL">Normální</option>
              <option value="LOW">Nízká</option>
            </select>
            <FieldError state={state} field="priority" />
          </label>

          {canManageAssignments ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700">Operátor</span>
              <select
                name="assignedUserId"
                defaultValue=""
                disabled={isPending}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="create-contact-assignee-select"
              >
                <option value="">Nepřiřazeno</option>
                {assignableOperators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name ?? operator.email}
                  </option>
                ))}
              </select>
              <FieldError state={state} field="assignedUserId" />
            </label>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
              data-testid="create-contact-submit-button"
            >
              {isPending ? "Ukládám…" : "Vytvořit kontakt"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
