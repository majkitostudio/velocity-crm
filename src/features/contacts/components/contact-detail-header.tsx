import { Breadcrumb } from "@/src/components/ui/breadcrumb";
import { PhoneActions } from "@/src/components/ui/phone-actions";
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
  returnTo: string;
  showCreatedMessage?: boolean;
};

export function ContactDetailHeader({
  view,
  returnTo,
  showCreatedMessage = false,
}: ContactDetailHeaderProps) {
  const { contact, workflowBadge } = view;
  const assigneeLabel = contact.assignedUser
    ? formatAssigneeName(contact.assignedUser)
    : "Unassigned";

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:-mx-6 sm:px-6">
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Kontakty", href: returnTo },
            { label: contact.name },
          ]}
        />

        {showCreatedMessage ? (
          <p
            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            data-testid="contact-created-message"
          >
            Kontakt byl úspěšně vytvořen.
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-zinc-900 sm:text-2xl">
            {contact.name}
          </h1>
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
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Phone</p>
        {contact.phone ? (
          <>
            <p
              className="mt-1 font-mono text-2xl font-semibold tracking-wide text-emerald-950 sm:text-3xl"
              data-testid="contact-phone"
            >
              {contact.phone}
            </p>
            <PhoneActions phone={contact.phone} />
          </>
        ) : (
          <p className="mt-1 text-sm text-emerald-900">No phone number on file</p>
        )}
      </div>
    </header>
  );
}
