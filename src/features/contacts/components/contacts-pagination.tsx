import Link from "next/link";

import { buildContactsListPath } from "../lib/list-navigation";
import type { ContactsPageView } from "../types";

type ContactsPaginationProps = {
  view: ContactsPageView;
};

function buildPageHref(view: ContactsPageView, page: number): string {
  const importBatchParam =
    view.importBatchFilter?.kind === "active" ? view.importBatchFilter.batchId : undefined;

  return buildContactsListPath({
    page: page > 1 ? page : undefined,
    limit: view.limit !== 50 ? view.limit : undefined,
    sort: view.sort !== "priority_desc" ? view.sort : undefined,
    status: view.statusFilter !== "ALL" ? view.statusFilter : undefined,
    source: view.sourceFilter !== "ALL" ? view.sourceFilter : undefined,
    priority: view.priorityFilter !== "ALL" ? view.priorityFilter : undefined,
    operator: view.selectedOperatorId ?? undefined,
    q: view.searchQuery || undefined,
    importBatch: importBatchParam,
  });
}

export function ContactsPagination({ view }: ContactsPaginationProps) {
  if (view.totalPages <= 1) {
    return (
      <p className="text-sm text-zinc-600" data-testid="contacts-pagination">
        {view.total} kontaktů
      </p>
    );
  }

  const previousPage = Math.max(1, view.page - 1);
  const nextPage = Math.min(view.totalPages, view.page + 1);

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      data-testid="contacts-pagination"
    >
      <p className="text-sm text-zinc-600">
        {view.total} kontaktů · strana {view.page} / {view.totalPages}
      </p>

      <div className="flex items-center gap-2">
        {view.page > 1 ? (
          <Link
            href={buildPageHref(view, previousPage)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            data-testid="contacts-pagination-prev"
          >
            Předchozí
          </Link>
        ) : (
          <span className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400">
            Předchozí
          </span>
        )}

        {view.page < view.totalPages ? (
          <Link
            href={buildPageHref(view, nextPage)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            data-testid="contacts-pagination-next"
          >
            Další
          </Link>
        ) : (
          <span className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400">
            Další
          </span>
        )}
      </div>
    </div>
  );
}
