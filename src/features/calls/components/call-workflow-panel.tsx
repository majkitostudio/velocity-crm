"use client";

import { useActionState, useEffect, useRef } from "react";

import type { ActionResult } from "@/src/domain/action-result";
import { CALL_LATER_DELAY_HOURS } from "@/src/domain/workflow";
import { completeCallAction } from "@/src/features/calls/actions";
import { CallOutcomeValue } from "@/src/features/calls/constants";
import { useCallWorkflowState } from "@/src/features/calls/hooks/use-call-workflow-state";
import { useNavigationGuard } from "@/src/features/calls/hooks/use-navigation-guard";
import type { CompleteCallResult } from "@/src/features/calls/types";

type CallWorkflowPanelProps = {
  contactId: string;
  sourceCallbackId: string | null;
  failCount: number;
  failThreshold: number;
};

const initialState: ActionResult<CompleteCallResult> | null = null;

const outcomeOptions = [
  {
    value: CallOutcomeValue.ORDER,
    label: "Order",
    disabled: true,
    hint: "Připravuje se (Slice 6)",
  },
  {
    value: CallOutcomeValue.CALL_LATER,
    label: "Call later",
    disabled: false,
    hint: null,
  },
  {
    value: CallOutcomeValue.SCHEDULE_CALL,
    label: "Schedule call",
    disabled: false,
    hint: null,
  },
  {
    value: CallOutcomeValue.FAIL,
    label: "Fail",
    disabled: false,
    hint: null,
  },
] as const;

export function CallWorkflowPanel({
  contactId,
  sourceCallbackId,
  failCount,
  failThreshold,
}: CallWorkflowPanelProps) {
  const {
    phase,
    selectedOutcome,
    idempotencyKey,
    startCall,
    endCall,
    selectOutcome,
    reset,
  } = useCallWorkflowState();
  const [state, formAction, isPending] = useActionState(completeCallAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useNavigationGuard(phase);

  useEffect(() => {
    if (state?.ok) {
      reset();
      formRef.current?.reset();
    }
  }, [state, reset]);

  const nextFailCount = failCount + 1;
  const willBecomeLost =
    selectedOutcome === CallOutcomeValue.FAIL && nextFailCount >= failThreshold;

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-4"
      data-testid="call-workflow-panel"
    >
      <h2 className="text-sm font-semibold text-zinc-900">Call workflow</h2>

      {phase === "idle" ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={startCall}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            data-testid="start-call-button"
          >
            Start call
          </button>
        </div>
      ) : null}

      {phase === "active" ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-zinc-600">Call in progress</p>
          <button
            type="button"
            onClick={endCall}
            className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            data-testid="end-call-button"
          >
            End call
          </button>
        </div>
      ) : null}

      {phase === "disposition" ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm font-medium text-amber-800">Select call outcome</p>

          <div className="grid grid-cols-2 gap-2">
            {outcomeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (
                    option.value === CallOutcomeValue.CALL_LATER ||
                    option.value === CallOutcomeValue.SCHEDULE_CALL ||
                    option.value === CallOutcomeValue.FAIL
                  ) {
                    selectOutcome(option.value);
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  option.disabled
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400"
                    : selectedOutcome === option.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-zinc-200 bg-white text-zinc-800 hover:border-emerald-300"
                }`}
                title={option.disabled ? option.hint ?? undefined : undefined}
              >
                {option.label}
                {option.disabled && option.hint ? (
                  <span className="mt-0.5 block text-xs font-normal">{option.hint}</span>
                ) : null}
              </button>
            ))}
          </div>

          {selectedOutcome === CallOutcomeValue.CALL_LATER ? (
            <p className="text-sm text-zinc-600">
              Callback bude vytvořen za {CALL_LATER_DELAY_HOURS} hodiny.
            </p>
          ) : null}

          {selectedOutcome === CallOutcomeValue.SCHEDULE_CALL ? (
            <form ref={formRef} action={formAction} className="space-y-3">
              <input type="hidden" name="contactId" value={contactId} />
              <input type="hidden" name="outcome" value={CallOutcomeValue.SCHEDULE_CALL} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey ?? ""} />
              {sourceCallbackId ? (
                <input type="hidden" name="sourceCallbackId" value={sourceCallbackId} />
              ) : null}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Date and time</span>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                />
              </label>
              {state?.ok === false && state.fieldErrors?.scheduledAt ? (
                <p className="text-sm text-red-600">{state.fieldErrors.scheduledAt[0]}</p>
              ) : null}
              <SubmitSection state={state} isPending={isPending} />
            </form>
          ) : null}

          {selectedOutcome === CallOutcomeValue.FAIL ? (
            <form ref={formRef} action={formAction} className="space-y-3">
              <input type="hidden" name="contactId" value={contactId} />
              <input type="hidden" name="outcome" value={CallOutcomeValue.FAIL} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey ?? ""} />
              {sourceCallbackId ? (
                <input type="hidden" name="sourceCallbackId" value={sourceCallbackId} />
              ) : null}
              <p className="text-sm text-zinc-600">
                Failed attempts: {failCount} / {failThreshold}
                {willBecomeLost ? (
                  <span className="mt-1 block font-medium text-red-700">
                    This attempt will mark the contact as Lost.
                  </span>
                ) : null}
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Note</span>
                <textarea
                  name="note"
                  rows={3}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                  placeholder="Optional note about this call…"
                />
              </label>
              <SubmitSection state={state} isPending={isPending} />
            </form>
          ) : null}

          {selectedOutcome === CallOutcomeValue.CALL_LATER ? (
            <form ref={formRef} action={formAction} className="space-y-3">
              <input type="hidden" name="contactId" value={contactId} />
              <input type="hidden" name="outcome" value={CallOutcomeValue.CALL_LATER} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey ?? ""} />
              {sourceCallbackId ? (
                <input type="hidden" name="sourceCallbackId" value={sourceCallbackId} />
              ) : null}
              <SubmitSection state={state} isPending={isPending} />
            </form>
          ) : null}
        </div>
      ) : null}

      {state?.ok === false && state.error && phase === "disposition" ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      {state?.ok ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Call completed.
        </p>
      ) : null}
    </section>
  );
}

type SubmitSectionProps = {
  state: ActionResult<CompleteCallResult> | null;
  isPending: boolean;
};

function SubmitSection({ isPending }: SubmitSectionProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      data-testid="confirm-call-button"
    >
      {isPending ? "Saving…" : "Confirm"}
    </button>
  );
}
