import type { Contact } from "@/src/generated/prisma/client";

export type QueueContact = Pick<
  Contact,
  | "id"
  | "name"
  | "phone"
  | "email"
  | "status"
  | "priority"
  | "source"
  | "assignedUserId"
  | "createdAt"
>;

export type OperatorQueueCallbackItem = {
  kind: "CALLBACK";
  callbackId: string;
  scheduledAt: Date;
  contact: QueueContact;
};

export type OperatorQueueLeadItem = {
  kind: "LEAD";
  callbackId: null;
  scheduledAt: null;
  contact: QueueContact;
};

export type OperatorQueueItem = OperatorQueueCallbackItem | OperatorQueueLeadItem;

export type OperatorQueueSnapshot = {
  items: OperatorQueueItem[];
  callbacks: OperatorQueueCallbackItem[];
  leads: OperatorQueueLeadItem[];
  counts: {
    callbacks: number;
    leads: number;
    total: number;
  };
};

export type AssignableOperatorOption = {
  id: string;
  name: string | null;
  email: string;
};

export type ManagerAssignmentPanelView = {
  unassignedLeads: QueueContact[];
  assignableOperators: AssignableOperatorOption[];
};
