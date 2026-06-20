import "server-only";

import { CallbackStatus, type Callback, type Prisma } from "@/src/generated/prisma/client";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/src/domain/errors";
import {
  canManageCompanyData,
  requireCurrentUser,
  type CurrentUser,
} from "@/src/server/auth/guards";
import { recordAuditEvent } from "@/src/server/audit";
import { prisma } from "@/src/server/db";

import { OPERATOR_CALLBACK_MIN_LEAD_MINUTES } from "../constants";
import type {
  CallbackAgendaBucket,
  CallbackAgendaSection,
  CallbackListItemView,
  CallbacksPageView,
  ContactCallbacksPanelView,
  CreateCallbackItemInput,
} from "../types";
import { resolveCallbackTransition } from "./callback-state-machine";
import {
  countOpenCallbacksForContact,
  createCallbackForCompany,
  createCallbacksForCompany,
  findAssignableOperatorsForCompany,
  findCallbackByIdForCompany,
  findContactByIdForCompany,
  findUserByIdForCompany,
  listCallbacksForOperator,
  listOpenCallbacksForContact,
  markCallbackDoneForCompany,
  updateCallbackForCompany,
} from "./callbacks.repository";

type TransactionClient = Prisma.TransactionClient;

type CallbackListRow = Awaited<ReturnType<typeof listCallbacksForOperator>>[number];

function mapCallbackListItem(row: CallbackListRow): CallbackListItemView {
  return {
    id: row.id,
    contactId: row.contactId,
    contactName: row.contact.name,
    contactPhone: row.contact.phone,
    scheduledAt: row.scheduledAt,
    status: row.status,
    note: row.note,
    assignedUserId: row.assignedUserId,
    assigneeName: row.assignedUser.name,
  };
}

function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function groupCallbacksIntoAgenda(
  items: CallbackListItemView[],
  now = new Date(),
): CallbackAgendaSection[] {
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const dayAfterTomorrowStart = addDays(todayStart, 2);

  const buckets: Record<CallbackAgendaBucket, CallbackListItemView[]> = {
    today: [],
    tomorrow: [],
    later: [],
  };

  for (const item of items) {
    const scheduledAt = item.scheduledAt;

    if (scheduledAt < dayAfterTomorrowStart) {
      if (scheduledAt < tomorrowStart) {
        buckets.today.push(item);
      } else {
        buckets.tomorrow.push(item);
      }
    } else {
      buckets.later.push(item);
    }
  }

  return (["today", "tomorrow", "later"] as const).map((bucket) => ({
    bucket,
    items: buckets[bucket],
  }));
}

function assertScheduledAtAllowed(input: {
  scheduledAt: Date;
  currentUser: CurrentUser;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  if (Number.isNaN(input.scheduledAt.getTime())) {
    throw new ValidationError("Neplatné datum a čas.");
  }

  if (canManageCompanyData(input.currentUser.role)) {
    if (input.scheduledAt.getTime() < now.getTime()) {
      throw new ValidationError("Termín callbacku musí být v budoucnu.");
    }

    return;
  }

  const minimumTime =
    now.getTime() + OPERATOR_CALLBACK_MIN_LEAD_MINUTES * 60 * 1000;

  if (input.scheduledAt.getTime() < minimumTime) {
    throw new ValidationError(
      `Termín musí být alespoň ${OPERATOR_CALLBACK_MIN_LEAD_MINUTES} minut od teď.`,
    );
  }
}

async function assertCallbackMutableAccess(input: {
  currentUser: CurrentUser;
  callback: NonNullable<Awaited<ReturnType<typeof findCallbackByIdForCompany>>>;
}) {
  if (
    input.callback.assignedUserId !== input.currentUser.id &&
    !canManageCompanyData(input.currentUser.role)
  ) {
    throw new ForbiddenError();
  }
}

async function resolveAssignedUserId(input: {
  currentUser: CurrentUser;
  assignedUserId?: string | null;
}): Promise<string> {
  const assignedUserId = input.assignedUserId ?? input.currentUser.id;

  if (
    assignedUserId !== input.currentUser.id &&
    !canManageCompanyData(input.currentUser.role)
  ) {
    throw new ForbiddenError("Pouze manažer nebo admin může přiřadit callback jinému operátorovi.");
  }

  const assignedUser = await findUserByIdForCompany({
    companyId: input.currentUser.companyId,
    userId: assignedUserId,
  });

  if (!assignedUser) {
    throw new NotFoundError("Přiřazený uživatel nebyl nalezen.");
  }

  return assignedUser.id;
}

async function assertContactExists(input: {
  companyId: string;
  contactId: string;
  tx?: TransactionClient;
}) {
  const contact = await findContactByIdForCompany(input);

  if (!contact) {
    throw new NotFoundError("Kontakt nebyl nalezen.");
  }

  return contact;
}

export async function assertSourceCallbackForCall(input: {
  currentUser: CurrentUser;
  contactId: string;
  sourceCallbackId?: string | null;
}) {
  if (!input.sourceCallbackId) {
    return null;
  }

  const callback = await findCallbackByIdForCompany({
    companyId: input.currentUser.companyId,
    callbackId: input.sourceCallbackId,
    contactId: input.contactId,
  });

  if (!callback) {
    throw new ValidationError("Callback pro tento kontakt nebyl nalezen.");
  }

  await assertCallbackMutableAccess({ currentUser: input.currentUser, callback });

  if (callback.status !== CallbackStatus.OPEN) {
    throw new ValidationError("Callback již není otevřený.");
  }

  return callback;
}

export async function createCallbackInTransaction(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    assignedUserId: string;
    scheduledAt: Date;
    note?: string | null;
  },
): Promise<Callback> {
  return createCallbackForCompany(tx, input);
}

export async function createCallbacksInTransaction(
  tx: TransactionClient,
  items: {
    companyId: string;
    contactId: string;
    assignedUserId: string;
    scheduledAt: Date;
    note?: string | null;
  }[],
): Promise<Callback[]> {
  return createCallbacksForCompany(tx, items);
}

export async function completeSourceCallbackInTransaction(
  tx: TransactionClient,
  input: {
    companyId: string;
    callbackId: string;
  },
): Promise<Callback> {
  return markCallbackDoneForCompany(tx, input);
}

async function recordCallbackAudit(input: {
  companyId: string;
  actorUserId: string;
  action: (typeof AuditActions)[keyof typeof AuditActions];
  callbackId: string;
  metadata?: Record<string, unknown>;
}) {
  await recordAuditEvent({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: AuditEntityTypes.CALLBACK,
    entityId: input.callbackId,
    metadata: input.metadata,
  });
}

export async function createCallback(input: {
  contactId: string;
  scheduledAt: Date;
  note?: string | null;
  assignedUserId?: string | null;
  allowDuplicateOpen?: boolean;
}): Promise<Callback> {
  const currentUser = await requireCurrentUser();

  assertScheduledAtAllowed({
    scheduledAt: input.scheduledAt,
    currentUser,
  });

  await assertContactExists({
    companyId: currentUser.companyId,
    contactId: input.contactId,
  });

  const assignedUserId = await resolveAssignedUserId({
    currentUser,
    assignedUserId: input.assignedUserId,
  });

  const openCount = await countOpenCallbacksForContact({
    companyId: currentUser.companyId,
    contactId: input.contactId,
  });

  if (openCount > 0 && !input.allowDuplicateOpen) {
    throw new ConflictError("Kontakt už má otevřený callback.");
  }

  const callback = await createCallbackForCompany(prisma, {
    companyId: currentUser.companyId,
    contactId: input.contactId,
    assignedUserId,
    scheduledAt: input.scheduledAt,
    note: input.note ?? null,
  });

  await recordCallbackAudit({
    companyId: currentUser.companyId,
    actorUserId: currentUser.id,
    action: AuditActions.CALLBACK_CREATED,
    callbackId: callback.id,
    metadata: {
      contactId: input.contactId,
      assignedUserId,
      scheduledAt: input.scheduledAt.toISOString(),
    },
  });

  return callback;
}

/** Future bulk scheduling entry point — Slice 7 exposes API shape only. */
export async function createCallbacks(
  items: CreateCallbackItemInput[],
): Promise<Callback[]> {
  if (items.length === 0) {
    return [];
  }

  const currentUser = await requireCurrentUser();

  for (const item of items) {
    assertScheduledAtAllowed({
      scheduledAt: item.scheduledAt,
      currentUser,
    });
  }

  return prisma.$transaction(async (tx) => {
    const created: Callback[] = [];

    for (const item of items) {
      await assertContactExists({
        companyId: currentUser.companyId,
        contactId: item.contactId,
        tx,
      });

      const assignedUserId = await resolveAssignedUserId({
        currentUser,
        assignedUserId: item.assignedUserId,
      });

      const callback = await createCallbackForCompany(tx, {
        companyId: currentUser.companyId,
        contactId: item.contactId,
        assignedUserId,
        scheduledAt: item.scheduledAt,
        note: item.note ?? null,
      });

      created.push(callback);
    }

    for (const callback of created) {
      await recordCallbackAudit({
        companyId: currentUser.companyId,
        actorUserId: currentUser.id,
        action: AuditActions.CALLBACK_CREATED,
        callbackId: callback.id,
      });
    }

    return created;
  });
}

export async function rescheduleCallback(input: {
  callbackId: string;
  scheduledAt: Date;
  note?: string | null;
}): Promise<Callback> {
  const currentUser = await requireCurrentUser();

  const callback = await findCallbackByIdForCompany({
    companyId: currentUser.companyId,
    callbackId: input.callbackId,
  });

  if (!callback) {
    throw new NotFoundError("Callback nebyl nalezen.");
  }

  await assertCallbackMutableAccess({ currentUser, callback });

  resolveCallbackTransition(callback.status, "reschedule");

  assertScheduledAtAllowed({
    scheduledAt: input.scheduledAt,
    currentUser,
  });

  const updated = await updateCallbackForCompany(prisma, {
    companyId: currentUser.companyId,
    callbackId: input.callbackId,
    scheduledAt: input.scheduledAt,
    note: input.note ?? callback.note,
  });

  await recordCallbackAudit({
    companyId: currentUser.companyId,
    actorUserId: currentUser.id,
    action: AuditActions.CALLBACK_UPDATED,
    callbackId: updated.id,
    metadata: {
      transition: "reschedule",
      scheduledAt: input.scheduledAt.toISOString(),
    },
  });

  return updated;
}

export async function cancelCallback(input: {
  callbackId: string;
  reason?: string | null;
}): Promise<Callback> {
  const currentUser = await requireCurrentUser();

  const callback = await findCallbackByIdForCompany({
    companyId: currentUser.companyId,
    callbackId: input.callbackId,
  });

  if (!callback) {
    throw new NotFoundError("Callback nebyl nalezen.");
  }

  await assertCallbackMutableAccess({ currentUser, callback });

  const nextStatus = resolveCallbackTransition(callback.status, "cancel");

  const note =
    input.reason && input.reason.length > 0
      ? [callback.note, `Zrušeno: ${input.reason}`].filter(Boolean).join("\n")
      : callback.note;

  const updated = await updateCallbackForCompany(prisma, {
    companyId: currentUser.companyId,
    callbackId: input.callbackId,
    status: nextStatus,
    note,
  });

  await recordCallbackAudit({
    companyId: currentUser.companyId,
    actorUserId: currentUser.id,
    action: AuditActions.CALLBACK_UPDATED,
    callbackId: updated.id,
    metadata: {
      transition: "cancel",
    },
  });

  return updated;
}

export async function getContactCallbacksPanelView(input: {
  contactId: string;
  highlightedCallbackId?: string | null;
}): Promise<ContactCallbacksPanelView> {
  const currentUser = await requireCurrentUser();

  await assertContactExists({
    companyId: currentUser.companyId,
    contactId: input.contactId,
  });

  const [openCallbacks, assignableOperators, openCount] = await Promise.all([
    listOpenCallbacksForContact({
      companyId: currentUser.companyId,
      contactId: input.contactId,
    }),
    findAssignableOperatorsForCompany(currentUser.companyId),
    countOpenCallbacksForContact({
      companyId: currentUser.companyId,
      contactId: input.contactId,
    }),
  ]);

  const highlightedCallbackId =
    input.highlightedCallbackId &&
    openCallbacks.some((callback) => callback.id === input.highlightedCallbackId)
      ? input.highlightedCallbackId
      : null;

  return {
    contactId: input.contactId,
    highlightedCallbackId,
    hasExistingOpenCallback: openCount > 0,
    canAssignToOthers: canManageCompanyData(currentUser.role),
    assignableOperators,
    openCallbacks: openCallbacks.map((callback) => ({
      id: callback.id,
      scheduledAt: callback.scheduledAt,
      status: callback.status,
      note: callback.note,
      assigneeName: callback.assignedUser.name,
    })),
  };
}

export async function getCallbacksPageView(input?: {
  operatorId?: string | null;
  statusFilter?: CallbacksPageView["statusFilter"];
}): Promise<CallbacksPageView> {
  const currentUser = await requireCurrentUser();
  const canManageAssignments = canManageCompanyData(currentUser.role);
  const selectedOperatorId =
    input?.operatorId && canManageAssignments ? input.operatorId : currentUser.id;
  const statusFilter = input?.statusFilter ?? "OPEN";

  if (
    selectedOperatorId !== currentUser.id &&
    !canManageAssignments
  ) {
    throw new ForbiddenError();
  }

  const since =
    statusFilter === "OPEN"
      ? undefined
      : addDays(startOfLocalDay(new Date()), -7);

  const rows = await listCallbacksForOperator({
    companyId: currentUser.companyId,
    operatorId: selectedOperatorId,
    status: statusFilter,
    since,
  });

  const listItems = rows.map(mapCallbackListItem);
  const openItems =
    statusFilter === "OPEN" ? listItems : listItems;

  return {
    listItems,
    agendaSections: groupCallbacksIntoAgenda(openItems),
    canManageAssignments,
    assignableOperators: canManageAssignments
      ? await findAssignableOperatorsForCompany(currentUser.companyId)
      : [],
    selectedOperatorId,
    statusFilter,
  };
}
