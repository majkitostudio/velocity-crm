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
  items: {
    quantity: number;
    unitPrice: { toString(): string };
  }[];
};

type TimelineSource = {
  calls: TimelineCall[];
  notes: TimelineNote[];
  callbacks: TimelineCallback[];
  orders: TimelineOrder[];
};

function parsePriceToCents(value: string): bigint {
  const [wholePart, decimalPart = ""] = value.split(".");
  const centsPart = decimalPart.padEnd(2, "0").slice(0, 2);
  return BigInt(wholePart) * BigInt(100) + BigInt(centsPart);
}

function formatCents(cents: bigint): string {
  const whole = cents / BigInt(100);
  const fraction = cents % BigInt(100);
  return `${whole.toString()}.${fraction.toString().padStart(2, "0")}`;
}

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
      total: formatCents(
        order.items.reduce(
          (total, item) =>
            total + parsePriceToCents(item.unitPrice.toString()) * BigInt(item.quantity),
          BigInt(0),
        ),
      ),
      operatorName: order.operator.name,
    })),
  ];

  return items.sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}
