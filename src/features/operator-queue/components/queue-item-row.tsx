import Link from "next/link";

import type { OperatorQueueItem } from "@/src/features/operator-queue/types";
import {
  formatContactChannel,
  formatDateTime,
  formatPriority,
  formatSource,
} from "@/src/features/operator-queue/lib/labels";

type QueueItemRowProps = {
  item: OperatorQueueItem;
  position: number;
};

function priorityClassName(priority: OperatorQueueItem["contact"]["priority"]): string {
  switch (priority) {
    case "HIGH":
      return "bg-amber-100 text-amber-800";
    case "LOW":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

export function QueueItemRow({ item, position }: QueueItemRowProps) {
  const { contact } = item;

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="block rounded-xl border border-zinc-200 bg-white px-4 py-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30"
    >
      <article className="flex items-start gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600">
          {position}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">{contact.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                item.kind === "CALLBACK"
                  ? "bg-sky-100 text-sky-800"
                  : "bg-violet-100 text-violet-800"
              }`}
            >
              {item.kind === "CALLBACK" ? "Callback" : "Lead"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClassName(contact.priority)}`}
            >
              {formatPriority(contact.priority)}
            </span>
          </div>

          <p className="mt-1 text-sm text-zinc-600">
            {formatContactChannel({ phone: contact.phone, email: contact.email })}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>Source: {formatSource(contact.source)}</span>
            <span>Added: {formatDateTime(contact.createdAt)}</span>
            {item.kind === "CALLBACK" ? (
              <span>Due: {formatDateTime(item.scheduledAt)}</span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
