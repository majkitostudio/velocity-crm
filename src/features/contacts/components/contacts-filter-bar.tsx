import Link from "next/link";

import {
  ContactPriority,
  ContactSource,
  ContactStatus,
} from "@/src/generated/prisma/client";

import { buildContactsListPath } from "../lib/list-navigation";
import {
  formatListPriorityLabel,
  formatListSortLabel,
  formatListSourceLabel,
  formatListStatusLabel,
  UNASSIGNED_OPERATOR_FILTER,
} from "../lib/list-labels";
import type { ContactsPageView } from "../types";
import { ContactsSearchInput } from "./contacts-search-input";

type ContactsFilterBarProps = {
  view: ContactsPageView;
};

const statusFilters: Array<ContactStatus | "ALL"> = [
  "ALL",
  ContactStatus.LEAD,
  ContactStatus.CUSTOMER,
  ContactStatus.VIP,
  ContactStatus.LOST,
];

const sourceFilters: Array<ContactSource | "ALL"> = [
  "ALL",
  ContactSource.MANUAL,
  ContactSource.CSV,
  ContactSource.API,
  ContactSource.OTHER,
];

const priorityFilters: Array<ContactPriority | "ALL"> = [
  "ALL",
  ContactPriority.HIGH,
  ContactPriority.NORMAL,
  ContactPriority.LOW,
];

const sortFilters = [
  "priority_desc",
  "created_asc",
  "created_desc",
  "updated_desc",
] as const;

function filterChipClassName(active: boolean): string {
  return active
    ? "bg-zinc-900 text-white"
    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200";
}

function operatorLabel(input: { name: string | null; email: string }): string {
  return input.name ?? input.email;
}

export function ContactsFilterBar({ view }: ContactsFilterBarProps) {
  const importBatchParam =
    view.importBatchFilter?.kind === "active" ? view.importBatchFilter.batchId : undefined;

  const searchListParams = {
    limit: view.limit !== 50 ? view.limit : undefined,
    sort: view.sort !== "priority_desc" ? view.sort : undefined,
    status: view.statusFilter !== "ALL" ? view.statusFilter : undefined,
    source: view.sourceFilter !== "ALL" ? view.sourceFilter : undefined,
    priority: view.priorityFilter !== "ALL" ? view.priorityFilter : undefined,
    operator: view.selectedOperatorId ?? undefined,
    importBatch: importBatchParam,
  };

  return (
    <div
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4"
      data-testid="contacts-filter-bar"
    >
      <ContactsSearchInput
        key={view.searchQuery}
        initialQuery={view.searchQuery}
        listParams={searchListParams}
      />

      <div className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Stav</span>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <Link
              key={status}
              href={buildContactsListPath({
                ...searchListParams,
                status: status !== "ALL" ? status : undefined,
                page: undefined,
                q: view.searchQuery || undefined,
              })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filterChipClassName(view.statusFilter === status)}`}
              data-testid={`contacts-status-filter-${status.toLowerCase()}`}
            >
              {formatListStatusLabel(status)}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Priorita</span>
        <div className="flex flex-wrap gap-2">
          {priorityFilters.map((priority) => (
            <Link
              key={priority}
              href={buildContactsListPath({
                ...searchListParams,
                priority: priority !== "ALL" ? priority : undefined,
                page: undefined,
                q: view.searchQuery || undefined,
              })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filterChipClassName(view.priorityFilter === priority)}`}
              data-testid={`contacts-priority-filter-${priority.toLowerCase()}`}
            >
              {formatListPriorityLabel(priority)}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Zdroj</span>
        <div className="flex flex-wrap gap-2">
          {sourceFilters.map((source) => (
            <Link
              key={source}
              href={buildContactsListPath({
                ...searchListParams,
                source: source !== "ALL" ? source : undefined,
                page: undefined,
                q: view.searchQuery || undefined,
              })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filterChipClassName(view.sourceFilter === source)}`}
              data-testid={`contacts-source-filter-${source.toLowerCase()}`}
            >
              {formatListSourceLabel(source)}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Řazení</span>
        <div className="flex flex-wrap gap-2">
          {sortFilters.map((sort) => (
            <Link
              key={sort}
              href={buildContactsListPath({
                ...searchListParams,
                sort: sort !== "priority_desc" ? sort : undefined,
                q: view.searchQuery || undefined,
              })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filterChipClassName(view.sort === sort)}`}
              data-testid={`contacts-sort-${sort}`}
            >
              {formatListSortLabel(sort)}
            </Link>
          ))}
        </div>
      </div>

      {view.canManageAssignments ? (
        <div className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Operátor</span>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildContactsListPath({
                ...searchListParams,
                operator: undefined,
                page: undefined,
                q: view.searchQuery || undefined,
              })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filterChipClassName(!view.selectedOperatorId)}`}
              data-testid="contacts-operator-filter-all"
            >
              Všichni
            </Link>
            <Link
              href={buildContactsListPath({
                ...searchListParams,
                operator: UNASSIGNED_OPERATOR_FILTER,
                page: undefined,
                q: view.searchQuery || undefined,
              })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filterChipClassName(view.selectedOperatorId === UNASSIGNED_OPERATOR_FILTER)}`}
              data-testid="contacts-operator-filter-unassigned"
            >
              Nepřiřazeno
            </Link>
            {view.assignableOperators.map((operator) => (
              <Link
                key={operator.id}
                href={buildContactsListPath({
                  ...searchListParams,
                  operator: operator.id,
                  page: undefined,
                  q: view.searchQuery || undefined,
                })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${filterChipClassName(view.selectedOperatorId === operator.id)}`}
                data-testid={`contacts-operator-filter-${operator.id}`}
              >
                {operatorLabel(operator)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
