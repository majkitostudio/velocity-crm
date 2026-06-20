import "server-only";

import { ForbiddenError } from "@/src/domain/errors";
import {
  canManageCompanyData,
  requireCurrentUser,
} from "@/src/server/auth/guards";
import { findAssignableOperatorsForCompany } from "@/src/features/callbacks/server/callbacks.repository";

import { buildContactsListPath } from "../lib/list-navigation";
import { UNASSIGNED_OPERATOR_FILTER } from "../lib/list-labels";
import {
  CONTACT_LIST_DEFAULT_LIMIT,
  CONTACT_LIST_MIN_SEARCH_LENGTH,
  listContactsQuerySchema,
  type ListContactsQuery,
} from "../schemas";
import type { ContactListItemView, ContactsPageView } from "../types";
import { buildWorkflowBadge } from "../view/build-workflow-badge";
import {
  countContactsForCompany,
  findLatestCallsForContacts,
  findNextOpenCallbacksForContacts,
  listContactsForCompany,
  type ContactListRow,
} from "./contacts-list.repository";

function mapContactListItem(input: {
  row: ContactListRow;
  nextOpenCallbackAt: Date | null;
  lastCallOutcome: ContactListItemView["lastCallOutcome"];
  lastCallAt: Date | null;
}): ContactListItemView {
  const assignee = input.row.assignedUser;

  return {
    id: input.row.id,
    name: input.row.name,
    phone: input.row.phone,
    email: input.row.email,
    status: input.row.status,
    source: input.row.source,
    priority: input.row.priority,
    assignedUserId: input.row.assignedUserId,
    assigneeName: assignee ? (assignee.name ?? assignee.email) : null,
    workflowBadge: buildWorkflowBadge({
      status: input.row.status,
      assignedUserId: input.row.assignedUserId,
    }),
    nextOpenCallbackAt: input.nextOpenCallbackAt,
    lastCallOutcome: input.lastCallOutcome,
    lastCallAt: input.lastCallAt,
    createdAt: input.row.createdAt,
    updatedAt: input.row.updatedAt,
  };
}

function resolveSearchQuery(query: string | undefined): string {
  const trimmed = query?.trim() ?? "";

  if (trimmed.length < CONTACT_LIST_MIN_SEARCH_LENGTH) {
    return "";
  }

  return trimmed;
}

function buildListPath(query: ListContactsQuery): string {
  return buildContactsListPath({
    page: query.page > 1 ? query.page : undefined,
    limit: query.limit !== CONTACT_LIST_DEFAULT_LIMIT ? query.limit : undefined,
    sort: query.sort !== "priority_desc" ? query.sort : undefined,
    status: query.status !== "ALL" ? query.status : undefined,
    source: query.source !== "ALL" ? query.source : undefined,
    priority: query.priority !== "ALL" ? query.priority : undefined,
    operator: query.operator,
    q: query.q,
  });
}

export async function getContactsPageView(
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<ContactsPageView> {
  const currentUser = await requireCurrentUser();
  const canManageAssignments = canManageCompanyData(currentUser.role);

  const parsed = listContactsQuerySchema.parse({
    page: Array.isArray(rawQuery.page) ? rawQuery.page[0] : rawQuery.page,
    limit: Array.isArray(rawQuery.limit) ? rawQuery.limit[0] : rawQuery.limit,
    sort: Array.isArray(rawQuery.sort) ? rawQuery.sort[0] : rawQuery.sort,
    status: Array.isArray(rawQuery.status) ? rawQuery.status[0] : rawQuery.status,
    source: Array.isArray(rawQuery.source) ? rawQuery.source[0] : rawQuery.source,
    priority: Array.isArray(rawQuery.priority)
      ? rawQuery.priority[0]
      : rawQuery.priority,
    operator: Array.isArray(rawQuery.operator)
      ? rawQuery.operator[0]
      : rawQuery.operator,
    q: Array.isArray(rawQuery.q) ? rawQuery.q[0] : rawQuery.q,
  });

  const searchQuery = resolveSearchQuery(parsed.q);
  const query: ListContactsQuery = {
    ...parsed,
    q: searchQuery || undefined,
  };

  let assignedUserId: string | null | undefined;

  if (currentUser.role === "OPERATOR") {
    assignedUserId = currentUser.id;

    if (query.operator && query.operator !== currentUser.id) {
      throw new ForbiddenError();
    }
  } else if (query.operator === UNASSIGNED_OPERATOR_FILTER) {
    assignedUserId = null;
  } else if (query.operator) {
    assignedUserId = query.operator;
  }

  const where = {
    companyId: currentUser.companyId,
    assignedUserId,
    status: query.status !== "ALL" ? query.status : undefined,
    source: query.source !== "ALL" ? query.source : undefined,
    priority: query.priority !== "ALL" ? query.priority : undefined,
    searchQuery: searchQuery || undefined,
  };

  const [total] = await Promise.all([countContactsForCompany(where)]);

  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, totalPages);
  const skip = (page - 1) * query.limit;

  const rows = await listContactsForCompany({
    where,
    sort: query.sort,
    skip,
    take: query.limit,
  });

  const contactIds = rows.map((row) => row.id);

  const [latestCalls, nextCallbacks] = await Promise.all([
    findLatestCallsForContacts({
      companyId: currentUser.companyId,
      contactIds,
    }),
    findNextOpenCallbacksForContacts({
      companyId: currentUser.companyId,
      contactIds,
    }),
  ]);

  const items = rows.map((row) => {
    const latestCall = latestCalls.get(row.id);

    return mapContactListItem({
      row,
      nextOpenCallbackAt: nextCallbacks.get(row.id) ?? null,
      lastCallOutcome: latestCall?.outcome ?? null,
      lastCallAt: latestCall?.createdAt ?? null,
    });
  });

  const listPath = buildListPath({ ...query, page });
  const selectedOperatorId =
    currentUser.role === "OPERATOR"
      ? currentUser.id
      : query.operator === UNASSIGNED_OPERATOR_FILTER
        ? UNASSIGNED_OPERATOR_FILTER
        : (query.operator ?? null);

  return {
    items,
    total,
    page,
    limit: query.limit,
    totalPages,
    sort: query.sort,
    statusFilter: query.status,
    sourceFilter: query.source,
    priorityFilter: query.priority,
    selectedOperatorId,
    searchQuery,
    canManageAssignments,
    assignableOperators: canManageAssignments
      ? await findAssignableOperatorsForCompany(currentUser.companyId)
      : [],
    listPath,
    returnTo: listPath,
  };
}
