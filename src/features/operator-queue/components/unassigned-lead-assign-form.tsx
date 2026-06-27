"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/src/domain/action-result";

import { assignContactAction } from "../actions";
import type { AssignableOperatorOption } from "../types";

type UnassignedLeadAssignFormProps = {
  contactId: string;
  assignableOperators: AssignableOperatorOption[];
};

const initialState: ActionResult<{ contactId: string }> | null = null;

export function UnassignedLeadAssignForm({
  contactId,
  assignableOperators,
}: UnassignedLeadAssignFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(assignContactAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  if (assignableOperators.length === 0) {
    return (
      <p className="text-xs text-zinc-500" data-testid="unassigned-lead-no-operators">
        Žádní operátoři k přiřazení.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2"
      data-testid="unassigned-lead-assign-form"
    >
      <input type="hidden" name="contactId" value={contactId} />

      {state?.ok === false && state.error ? (
        <p
          className="w-full rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700"
          data-testid="unassigned-lead-assign-error"
        >
          {state.error}
        </p>
      ) : null}

      <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600">Operátor</span>
        <select
          name="operatorId"
          required
          disabled={isPending}
          defaultValue=""
          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="unassigned-lead-operator-select"
        >
          <option value="" disabled>
            Vyberte operátora
          </option>
          {assignableOperators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.name ?? operator.email}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="unassigned-lead-assign-submit"
      >
        {isPending ? "Přiřazuji…" : "Přiřadit"}
      </button>
    </form>
  );
}
