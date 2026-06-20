import type { CallbackStatus } from "@/src/generated/prisma/client";

/** Single-item input; batch APIs can accept CreateCallbackItemInput[]. */
export type CreateCallbackItemInput = {
  contactId: string;
  assignedUserId: string;
  scheduledAt: Date;
  note?: string | null;
};

export type CallbackAssigneeOption = {
  id: string;
  name: string | null;
  email: string;
};

export type CallbackListItemView = {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string | null;
  scheduledAt: Date;
  status: CallbackStatus;
  note: string | null;
  assignedUserId: string;
  assigneeName: string | null;
};

export type CallbackAgendaBucket = "today" | "tomorrow" | "later";

export type CallbackAgendaSection = {
  bucket: CallbackAgendaBucket;
  items: CallbackListItemView[];
};

export type ContactCallbackPanelItem = {
  id: string;
  scheduledAt: Date;
  status: CallbackStatus;
  note: string | null;
  assigneeName: string | null;
};

export type ContactCallbacksPanelView = {
  contactId: string;
  openCallbacks: ContactCallbackPanelItem[];
  highlightedCallbackId: string | null;
  canAssignToOthers: boolean;
  assignableOperators: CallbackAssigneeOption[];
  hasExistingOpenCallback: boolean;
};

export type CallbacksPageView = {
  listItems: CallbackListItemView[];
  agendaSections: CallbackAgendaSection[];
  canManageAssignments: boolean;
  assignableOperators: CallbackAssigneeOption[];
  selectedOperatorId: string;
  statusFilter: CallbackStatusFilter;
};

export type CallbackStatusFilter = "OPEN" | "DONE" | "CANCELLED";
