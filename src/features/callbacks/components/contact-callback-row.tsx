"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/src/domain/action-result";
import {
  cancelCallbackAction,
  rescheduleCallbackAction,
} from "../actions";
import {
  formatCallbackDateTime,
  formatCallbackStatusLabel,
} from "../lib/labels";
import type { ContactCallbackPanelItem } from "../types";

type ContactCallbackRowProps = {
  callback: ContactCallbackPanelItem;
  highlighted?: boolean;
};

const rescheduleInitialState: ActionResult<{ callbackId: string }> | null = null;
const cancelInitialState: ActionResult<{ callbackId: string }> | null = null;

function toDateTimeLocalValue(value: Date): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ContactCallbackRow({ callback, highlighted = false }: ContactCallbackRowProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rescheduleState, rescheduleAction, isRescheduling] = useActionState(
    rescheduleCallbackAction,
    rescheduleInitialState,
  );
  const [cancelState, cancelAction, isCancelling] = useActionState(
    cancelCallbackAction,
    cancelInitialState,
  );

  useEffect(() => {
    if (rescheduleState?.ok || cancelState?.ok) {
      dialogRef.current?.close();
      router.refresh();
    }
  }, [rescheduleState, cancelState, router]);

  return (
    <article
      className={`rounded-lg border p-3 ${
        highlighted
          ? "border-sky-400 bg-sky-50 ring-2 ring-sky-200"
          : "border-zinc-200 bg-zinc-50"
      }`}
      data-testid="contact-callback-row"
      data-callback-id={callback.id}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {formatCallbackDateTime(callback.scheduledAt)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">
            {formatCallbackStatusLabel(callback.status)}
            {callback.assigneeName ? ` · ${callback.assigneeName}` : ""}
          </p>
          {callback.note ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{callback.note}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="shrink-0 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          data-testid="callback-manage-button"
        >
          Spravovat
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-zinc-900/40"
        data-testid="callback-manage-dialog"
      >
        <div className="border-b border-zinc-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">Správa callbacku</h3>
        </div>

        <div className="space-y-4 p-4">
          <form action={rescheduleAction} className="space-y-3">
            <input type="hidden" name="callbackId" value={callback.id} />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700">Nový termín</span>
              <input
                type="datetime-local"
                name="scheduledAt"
                required
                defaultValue={toDateTimeLocalValue(callback.scheduledAt)}
                disabled={isRescheduling || isCancelling}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                data-testid="callback-reschedule-input"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700">Poznámka</span>
              <textarea
                name="note"
                rows={2}
                defaultValue={callback.note ?? ""}
                disabled={isRescheduling || isCancelling}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
              />
            </label>
            {rescheduleState?.ok === false && rescheduleState.error ? (
              <p className="text-sm text-red-600">{rescheduleState.error}</p>
            ) : null}
            <button
              type="submit"
              disabled={isRescheduling || isCancelling}
              className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
              data-testid="callback-reschedule-submit"
            >
              {isRescheduling ? "Ukládám…" : "Přeplánovat"}
            </button>
          </form>

          <form action={cancelAction} className="space-y-3 border-t border-zinc-200 pt-4">
            <input type="hidden" name="callbackId" value={callback.id} />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700">Důvod zrušení</span>
              <textarea
                name="reason"
                rows={2}
                disabled={isRescheduling || isCancelling}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                placeholder="Volitelné"
              />
            </label>
            {cancelState?.ok === false && cancelState.error ? (
              <p className="text-sm text-red-600">{cancelState.error}</p>
            ) : null}
            <button
              type="submit"
              disabled={isRescheduling || isCancelling}
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
              data-testid="callback-cancel-submit"
            >
              {isCancelling ? "Ruším…" : "Zrušit callback"}
            </button>
          </form>
        </div>

        <div className="border-t border-zinc-200 px-4 py-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Zavřít
          </button>
        </div>
      </dialog>
    </article>
  );
}
