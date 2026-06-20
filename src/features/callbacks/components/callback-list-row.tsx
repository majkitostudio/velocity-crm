import Link from "next/link";

import {
  contactCallbackHref,
  formatCallbackDateTime,
  formatCallbackStatusLabel,
} from "../lib/labels";
import type { CallbackListItemView } from "../types";

type CallbackListRowProps = {
  item: CallbackListItemView;
};

export function CallbackListRow({ item }: CallbackListRowProps) {
  return (
    <Link
      href={contactCallbackHref(item.contactId, item.id)}
      className="group block rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-sm"
      data-testid="callback-list-link"
      data-callback-id={item.id}
    >
      <article className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-900">
              {item.contactName}
            </h3>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
              {formatCallbackStatusLabel(item.status)}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-zinc-700">
            {item.contactPhone ?? "Bez telefonu"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Termín: {formatCallbackDateTime(item.scheduledAt)}
          </p>
          {item.note ? (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{item.note}</p>
          ) : null}
        </div>
        <span
          className="mt-1 text-lg text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700"
          aria-hidden="true"
        >
          ›
        </span>
      </article>
    </Link>
  );
}
