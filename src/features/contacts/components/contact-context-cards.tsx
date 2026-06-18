import type { ContactContextSummary } from "../types";
import {
  formatCallOutcome,
  formatCallbackStatus,
  formatDateTime,
} from "../lib/labels";

type ContactContextCardsProps = {
  context: ContactContextSummary;
};

export function ContactContextCards({ context }: ContactContextCardsProps) {
  const nextCallback = context.openCallbacks[0] ?? null;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <article className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Next callback
        </h2>
        {nextCallback ? (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-semibold text-zinc-900">
              {formatDateTime(nextCallback.scheduledAt)}
            </p>
            <p className="text-xs text-zinc-600">
              {formatCallbackStatus(nextCallback.status)}
            </p>
            {nextCallback.note ? (
              <p className="text-sm text-zinc-600">{nextCallback.note}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">No open callbacks</p>
        )}
      </article>

      <article className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Fail attempts
        </h2>
        <p className="mt-2 text-sm font-semibold text-zinc-900">
          {context.failCount} / {context.failThreshold}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Failed call outcomes toward automatic lost status.
        </p>
      </article>

      <article className="rounded-xl border border-zinc-200 bg-white p-4 sm:col-span-2 xl:col-span-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Last call
        </h2>
        {context.lastCall ? (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-semibold text-zinc-900">
              {formatCallOutcome(context.lastCall.outcome)}
            </p>
            <p className="text-xs text-zinc-600">
              {formatDateTime(context.lastCall.createdAt)}
              {context.lastCall.operatorName
                ? ` · ${context.lastCall.operatorName}`
                : ""}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">No calls logged yet</p>
        )}
      </article>
    </section>
  );
}
