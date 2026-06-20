import Link from "next/link";

import { buildContactDetailHref } from "../lib/list-navigation";
import {
  formatListCallOutcome,
  formatListChannel,
  formatListDateTime,
  formatListPriorityLabel,
  formatListSourceLabel,
  formatListStatusLabel,
  formatListWorkflowBadge,
  listPriorityClassName,
  listStatusClassName,
  listWorkflowBadgeClassName,
} from "../lib/list-labels";
import type { ContactListItemView } from "../types";

type ContactListRowProps = {
  item: ContactListItemView;
  returnTo: string;
};

export function ContactListRow({ item, returnTo }: ContactListRowProps) {
  const href = buildContactDetailHref({
    contactId: item.id,
    returnTo,
  });

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-sm"
      data-testid="contact-list-link"
      data-contact-id={item.id}
    >
      <article className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-900">
              {item.name}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${listStatusClassName(item.status)}`}
            >
              {formatListStatusLabel(item.status)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${listPriorityClassName(item.priority)}`}
            >
              {formatListPriorityLabel(item.priority)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${listWorkflowBadgeClassName(item.workflowBadge)}`}
            >
              {formatListWorkflowBadge(item.workflowBadge)}
            </span>
          </div>

          <p className="mt-1 font-mono text-sm text-zinc-700">
            {formatListChannel({ phone: item.phone, email: item.email })}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>
              Operátor: {item.assigneeName ?? "Nepřiřazeno"}
            </span>
            <span>Zdroj: {formatListSourceLabel(item.source)}</span>
            {item.nextOpenCallbackAt ? (
              <span>Callback: {formatListDateTime(item.nextOpenCallbackAt)}</span>
            ) : null}
            {item.lastCallAt ? (
              <span>
                Poslední hovor: {formatListCallOutcome(item.lastCallOutcome ?? "")}{" "}
                ({formatListDateTime(item.lastCallAt)})
              </span>
            ) : null}
          </div>
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
