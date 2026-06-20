import Link from "next/link";

import { formatStatusFilterLabel } from "../lib/labels";
import type { CallbackAssigneeOption, CallbacksPageView } from "../types";

type CallbacksFilterBarProps = {
  view: CallbacksPageView;
  activeView: "list" | "agenda";
};

const statusFilters: CallbacksPageView["statusFilter"][] = [
  "OPEN",
  "DONE",
  "CANCELLED",
];

function buildCallbacksHref(input: {
  operatorId?: string;
  status?: CallbacksPageView["statusFilter"];
  view?: "list" | "agenda";
}): string {
  const params = new URLSearchParams();

  if (input.operatorId) {
    params.set("operator", input.operatorId);
  }

  if (input.status) {
    params.set("status", input.status);
  }

  if (input.view === "list") {
    params.set("view", "list");
  }

  const query = params.toString();
  return query.length > 0 ? `/callbacks?${query}` : "/callbacks";
}

function operatorLabel(operator: CallbackAssigneeOption): string {
  return operator.name ?? operator.email;
}

export function CallbacksFilterBar({ view, activeView }: CallbacksFilterBarProps) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4" data-testid="callbacks-filter-bar">
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildCallbacksHref({
            operatorId: view.selectedOperatorId,
            status: view.statusFilter,
          })}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            activeView === "agenda"
              ? "bg-emerald-700 text-white"
              : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Podle dnů
        </Link>
        <Link
          href={buildCallbacksHref({
            operatorId: view.selectedOperatorId,
            status: view.statusFilter,
            view: "list",
          })}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            activeView === "list"
              ? "bg-emerald-700 text-white"
              : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Seznam
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <Link
            key={status}
            href={buildCallbacksHref({
              operatorId: view.selectedOperatorId,
              status,
              view: activeView === "list" ? "list" : undefined,
            })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              view.statusFilter === status
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
            data-testid={`callback-status-filter-${status.toLowerCase()}`}
          >
            {formatStatusFilterLabel(status)}
          </Link>
        ))}
      </div>

      {view.canManageAssignments ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Operátor</span>
          <div className="flex flex-wrap gap-2">
            {view.assignableOperators.map((operator) => (
              <Link
                key={operator.id}
                href={buildCallbacksHref({
                  operatorId: operator.id,
                  status: view.statusFilter,
                  view: activeView === "list" ? "list" : undefined,
                })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  view.selectedOperatorId === operator.id
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
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
