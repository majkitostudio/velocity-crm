import Link from "next/link";

import type { ContactDetailView } from "../types";
import {
  contactStatusClassName,
  formatAssigneeName,
  formatContactStatus,
  formatWorkflowBadgeLabel,
  workflowBadgeClassName,
} from "../lib/labels";

type ContactDetailHeaderProps = {
  view: ContactDetailView;
};

export function ContactDetailHeader({ view }: ContactDetailHeaderProps) {
  const { contact, workflowBadge } = view;
  const assigneeLabel = contact.assignedUser
    ? formatAssigneeName(contact.assignedUser)
    : "Unassigned";

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-900"
          >
            <span aria-hidden="true">←</span>
            Dashboard
          </Link>

          <div className="min-w-0 sm:border-l sm:border-zinc-200 sm:pl-4">
            <h1 className="truncate text-xl font-semibold text-zinc-900 sm:text-2xl">
              {contact.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${contactStatusClassName(contact.status)}`}
          >
            {formatContactStatus(contact.status)}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${workflowBadgeClassName(workflowBadge)}`}
          >
            {formatWorkflowBadgeLabel(workflowBadge)}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
            {assigneeLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
          Phone
        </p>
        {contact.phone ? (
          <p
            className="mt-1 font-mono text-2xl font-semibold tracking-wide text-emerald-950 sm:text-3xl"
            data-testid="contact-phone"
          >
            {contact.phone}
          </p>
        ) : (
          <p className="mt-1 text-sm text-emerald-900">No phone number on file</p>
        )}
        <p className="mt-1 text-xs text-emerald-700">
          Copy and click-to-call actions will be available in a future slice.
        </p>
      </div>
    </header>
  );
}
