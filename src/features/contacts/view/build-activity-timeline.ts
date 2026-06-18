import type { CallOutcome } from "@/src/generated/prisma/client";

import type { ContactActivityItem } from "../types";

type TimelineCall = {
  id: string;
  outcome: CallOutcome;
  note: string | null;
  createdAt: Date;
  operator: { name: string | null };
};

type TimelineNote = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string | null };
};

type TimelineCallback = {
  id: string;
  scheduledAt: Date;
  status: import("@/src/generated/prisma/client").CallbackStatus;
  note: string | null;
  createdAt: Date;
  assignedUser: { name: string | null };
};

type TimelineOrder = {
  id: string;
  status: import("@/src/generated/prisma/client").OrderStatus;
  createdAt: Date;
  operator: { name: string | null };
  _count: { items: number };
};

type TimelineSource = {
  calls: TimelineCall[];
  notes: TimelineNote[];
  callbacks: TimelineCallback[];
  orders: TimelineOrder[];
};

export function buildActivityTimeline(source: TimelineSource): ContactActivityItem[] {
  const items: ContactActivityItem[] = [
    ...source.calls.map((call) => ({
      kind: "CALL" as const,
      id: call.id,
      occurredAt: call.createdAt,
      outcome: call.outcome,
      note: call.note,
      operatorName: call.operator.name,
    })),
    ...source.notes.map((note) => ({
      kind: "NOTE" as const,
      id: note.id,
      occurredAt: note.createdAt,
      body: note.body,
      authorName: note.author.name,
    })),
    ...source.callbacks.map((callback) => ({
      kind: "CALLBACK" as const,
      id: callback.id,
      occurredAt: callback.createdAt,
      scheduledAt: callback.scheduledAt,
      status: callback.status,
      note: callback.note,
      assigneeName: callback.assignedUser.name,
    })),
    ...source.orders.map((order) => ({
      kind: "ORDER" as const,
      id: order.id,
      occurredAt: order.createdAt,
      status: order.status,
      itemCount: order._count.items,
      operatorName: order.operator.name,
    })),
  ];

  return items.sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}
