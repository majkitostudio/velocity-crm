import type {
  CallbackStatus,
  CallOutcome,
  ContactPriority,
  ContactSource,
  ContactStatus,
  OrderStatus,
} from "@/src/generated/prisma/client";

import type { ContactFieldCatalogEntry } from "./lib/contact-fields";
import type { ListContactsSort } from "./schemas";

export type ContactWorkflowBadge =
  | "NEW"
  | "ASSIGNED"
  | "CONVERTED"
  | "FAILED"
  | "IN_PROGRESS";

export type ContactAssignee = {
  id: string;
  name: string | null;
  email: string;
};

export type ContactDetailContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
  status: ContactStatus;
  source: ContactSource;
  priority: ContactPriority;
  assignedUserId: string | null;
  assignedUser: ContactAssignee | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactContextSummary = {
  openCallbacks: ContactOpenCallback[];
  failCount: number;
  failThreshold: number;
  lastCall: ContactLastCall | null;
};

export type ContactOpenCallback = {
  id: string;
  scheduledAt: Date;
  status: CallbackStatus;
  note: string | null;
};

export type ContactLastCall = {
  id: string;
  outcome: CallOutcome;
  createdAt: Date;
  operatorName: string | null;
};

export type ContactActivityCallItem = {
  kind: "CALL";
  id: string;
  occurredAt: Date;
  outcome: CallOutcome;
  note: string | null;
  operatorName: string | null;
};

export type ContactActivityNoteItem = {
  kind: "NOTE";
  id: string;
  occurredAt: Date;
  body: string;
  authorName: string | null;
};

export type ContactActivityCallbackItem = {
  kind: "CALLBACK";
  id: string;
  occurredAt: Date;
  scheduledAt: Date;
  status: CallbackStatus;
  note: string | null;
  assigneeName: string | null;
};

export type ContactActivityOrderItem = {
  kind: "ORDER";
  id: string;
  occurredAt: Date;
  status: OrderStatus;
  itemCount: number;
  total: string;
  operatorName: string | null;
};

export type ContactActivityItem =
  | ContactActivityCallItem
  | ContactActivityNoteItem
  | ContactActivityCallbackItem
  | ContactActivityOrderItem;

export type ContactNoteView = {
  id: string;
  body: string;
  createdAt: Date;
  authorName: string | null;
};

export type ContactListItemView = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: ContactStatus;
  source: ContactSource;
  priority: ContactPriority;
  assignedUserId: string | null;
  assigneeName: string | null;
  workflowBadge: ContactWorkflowBadge;
  nextOpenCallbackAt: Date | null;
  lastCallOutcome: CallOutcome | null;
  lastCallAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactListAssigneeOption = {
  id: string;
  name: string | null;
  email: string;
};

export type ImportPageView = {
  returnTo: string;
  assignableOperators: ContactListAssigneeOption[];
  mappableFields: readonly ContactFieldCatalogEntry[];
};

export type ContactsPageView = {
  items: ContactListItemView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sort: ListContactsSort;
  statusFilter: ContactStatus | "ALL";
  sourceFilter: ContactSource | "ALL";
  priorityFilter: ContactPriority | "ALL";
  selectedOperatorId: string | null;
  searchQuery: string;
  canManageAssignments: boolean;
  assignableOperators: ContactListAssigneeOption[];
  listPath: string;
  returnTo: string;
};

export type ContactCallWorkflowContext = {
  failCount: number;
  failThreshold: number;
  sourceCallbackId: string | null;
  sourceCallbackScheduledAt: Date | null;
  sourceCallbackNote: string | null;
};

export type ContactDetailView = {
  contact: ContactDetailContact;
  workflowBadge: ContactWorkflowBadge;
  context: ContactContextSummary;
  activity: ContactActivityItem[];
  notes: ContactNoteView[];
  callWorkflow: ContactCallWorkflowContext;
};
