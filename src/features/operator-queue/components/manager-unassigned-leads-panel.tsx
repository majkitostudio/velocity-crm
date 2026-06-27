import Link from "next/link";

import {
  formatContactChannel,
  formatDateTime,
  formatPriority,
  formatSource,
} from "@/src/features/operator-queue/lib/labels";
import type { ManagerAssignmentPanelView } from "@/src/features/operator-queue/types";

import { UnassignedLeadAssignForm } from "./unassigned-lead-assign-form";

type ManagerUnassignedLeadsPanelProps = {
  panel: ManagerAssignmentPanelView;
};

function priorityClassName(
  priority: ManagerAssignmentPanelView["unassignedLeads"][number]["priority"],
): string {
  switch (priority) {
    case "HIGH":
      return "bg-amber-100 text-amber-800";
    case "LOW":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

export function ManagerUnassignedLeadsPanel({ panel }: ManagerUnassignedLeadsPanelProps) {
  const { unassignedLeads, assignableOperators } = panel;

  return (
    <section className="space-y-3" data-testid="manager-unassigned-leads-panel">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Nepřiřazené leady
          <span className="ml-2 text-sm font-normal text-zinc-500">
            ({unassignedLeads.length})
          </span>
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Leady bez operátora. Přiřaďte je do fronty pro volání.
        </p>
      </div>

      {unassignedLeads.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-600"
          data-testid="manager-unassigned-leads-empty"
        >
          Všechny leady jsou přiřazené.
        </div>
      ) : (
        <ul className="space-y-2">
          {unassignedLeads.map((contact) => (
            <li
              key={contact.id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm"
              data-testid="unassigned-lead-row"
              data-contact-id={contact.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="text-sm font-semibold text-zinc-900 hover:text-emerald-800"
                      data-testid="unassigned-lead-name-link"
                    >
                      {contact.name}
                    </Link>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                      Lead
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
                  </div>
                </div>

                <div className="w-full shrink-0 lg:max-w-sm">
                  <UnassignedLeadAssignForm
                    contactId={contact.id}
                    assignableOperators={assignableOperators}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
