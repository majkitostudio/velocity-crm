import { createHash } from "node:crypto";

import type { ContactAiContext } from "../types/contact-ai-context";

type ContextHashInput = {
  contactUpdatedAt: string;
  statistics: ContactAiContext["statistics"];
  workflow: {
    failCount: number;
    lastCallId: string | null;
    lastCallOutcome: string | null;
    lastCallCreatedAt: string | null;
  };
  callbacks: {
    open: readonly { id: string; status: string; scheduledAt: string }[];
    recentClosed: readonly { id: string; status: string; scheduledAt: string }[];
  };
  orders: readonly { id: string; status: string; createdAt: string }[];
  notes: readonly { id: string; createdAt: string }[];
  activities: readonly { id: string; kind: string; occurredAt: string }[];
};

function buildHashInput(context: ContactAiContext): ContextHashInput {
  return {
    contactUpdatedAt: context.contact.updatedAt,
    statistics: context.statistics,
    workflow: {
      failCount: context.snapshot.workflow.failCount,
      lastCallId: context.snapshot.workflow.lastCall?.id ?? null,
      lastCallOutcome: context.snapshot.workflow.lastCall?.outcome ?? null,
      lastCallCreatedAt: context.snapshot.workflow.lastCall?.createdAt ?? null,
    },
    callbacks: {
      open: context.snapshot.callbacks.open.map((callback) => ({
        id: callback.id,
        status: callback.status,
        scheduledAt: callback.scheduledAt,
      })),
      recentClosed: context.snapshot.callbacks.recentClosed.map((callback) => ({
        id: callback.id,
        status: callback.status,
        scheduledAt: callback.scheduledAt,
      })),
    },
    orders: context.snapshot.orders.recent.map((order) => ({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
    })),
    notes: context.snapshot.notes.recent.map((note) => ({
      id: note.id,
      createdAt: note.createdAt,
    })),
    activities: context.history.activities.map((activity) => ({
      id: activity.id,
      kind: activity.kind,
      occurredAt: activity.occurredAt,
    })),
  };
}

export function computeContactContextHash(context: ContactAiContext): string {
  const payload = buildHashInput(context);
  const canonical = JSON.stringify(payload);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
