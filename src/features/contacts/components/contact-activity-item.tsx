import type { ContactActivityItem } from "../types";
import {
  activityKindLabel,
  formatCallOutcome,
  formatCallbackStatus,
  formatDateTime,
  formatOrderStatus,
} from "../lib/labels";

type ContactActivityItemRowProps = {
  item: ContactActivityItem;
};

function kindAccentClass(kind: ContactActivityItem["kind"]): string {
  switch (kind) {
    case "CALL":
      return "border-l-amber-400";
    case "NOTE":
      return "border-l-zinc-400";
    case "CALLBACK":
      return "border-l-sky-400";
    case "ORDER":
      return "border-l-emerald-500";
    default:
      return "border-l-zinc-300";
  }
}

function formatPriceCzk(price: string): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return `${price} Kč`;
  }

  return `${numericPrice.toFixed(2)} Kč`;
}

export function ContactActivityItemRow({ item }: ContactActivityItemRowProps) {
  return (
    <article
      className={`flex gap-3 rounded-xl border border-zinc-200 border-l-4 bg-white px-4 py-3 ${kindAccentClass(item.kind)}`}
      data-testid={`activity-${item.kind.toLowerCase()}-item`}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
        {activityKindLabel(item.kind).slice(0, 1)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            {activityKindLabel(item.kind)}
          </h3>
          <time className="text-xs text-zinc-500" dateTime={item.occurredAt.toISOString()}>
            {formatDateTime(item.occurredAt)}
          </time>
        </div>

        {item.kind === "CALL" ? (
          <div className="mt-1 space-y-1 text-sm text-zinc-600" data-testid="activity-call-detail">
            <p>Outcome: {formatCallOutcome(item.outcome)}</p>
            {item.operatorName ? <p>Operator: {item.operatorName}</p> : null}
            {item.note ? <p className="whitespace-pre-wrap">{item.note}</p> : null}
          </div>
        ) : null}

        {item.kind === "NOTE" ? (
          <div className="mt-1 space-y-1 text-sm text-zinc-600">
            {item.authorName ? <p>Author: {item.authorName}</p> : null}
            <p className="whitespace-pre-wrap">{item.body}</p>
          </div>
        ) : null}

        {item.kind === "CALLBACK" ? (
          <div className="mt-1 space-y-1 text-sm text-zinc-600" data-testid="activity-callback-detail">
            <p>Scheduled: {formatDateTime(item.scheduledAt)}</p>
            <p>Status: {formatCallbackStatus(item.status)}</p>
            {item.assigneeName ? <p>Assignee: {item.assigneeName}</p> : null}
            {item.note ? <p className="whitespace-pre-wrap">{item.note}</p> : null}
          </div>
        ) : null}

        {item.kind === "ORDER" ? (
          <div className="mt-1 space-y-1 text-sm text-zinc-600" data-testid="activity-order-detail">
            <p>Status: {formatOrderStatus(item.status)}</p>
            <p>
              {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
            </p>
            <p>Total: {formatPriceCzk(item.total)}</p>
            {item.operatorName ? <p>Operator: {item.operatorName}</p> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
