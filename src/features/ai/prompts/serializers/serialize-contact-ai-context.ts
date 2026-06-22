import type { ContactAiContext } from "@/src/features/ai/context/types/contact-ai-context";

import type { PromptBuildInput } from "../types/prompt-template";

export type SerializeContactAiContextOptions = PromptBuildInput["contextView"] & {
  includeSensitiveData?: boolean;
};

function buildSerializedPayload(
  context: ContactAiContext,
  options?: SerializeContactAiContextOptions,
) {
  const includeSensitive = options?.includeSensitiveData !== false;
  const maxHistory = options?.maxHistoryItems;

  const historyActivities =
    maxHistory !== undefined
      ? context.history.activities.slice(0, maxHistory)
      : context.history.activities;

  return {
    contact: {
      id: context.contact.id,
      name: context.contact.name,
      phone: includeSensitive ? context.contact.phone : null,
      email: includeSensitive ? context.contact.email : null,
      address: {
        street: context.contact.address.street,
        city: context.contact.address.city,
        zipCode: context.contact.address.zipCode,
        country: context.contact.address.country,
      },
      status: context.contact.status,
      source: context.contact.source,
      priority: context.contact.priority,
      assignedUser: context.contact.assignedUser
        ? {
            id: context.contact.assignedUser.id,
            name: context.contact.assignedUser.name,
            email: context.contact.assignedUser.email,
          }
        : null,
      createdAt: context.contact.createdAt,
      updatedAt: context.contact.updatedAt,
    },
    snapshot: {
      workflow: {
        failCount: context.snapshot.workflow.failCount,
        failThreshold: context.snapshot.workflow.failThreshold,
        lastCall: context.snapshot.workflow.lastCall
          ? {
              id: context.snapshot.workflow.lastCall.id,
              outcome: context.snapshot.workflow.lastCall.outcome,
              operatorName: context.snapshot.workflow.lastCall.operatorName,
              createdAt: context.snapshot.workflow.lastCall.createdAt,
              note: context.snapshot.workflow.lastCall.note,
            }
          : null,
      },
      callbacks: {
        open: context.snapshot.callbacks.open.map((callback) => ({
          id: callback.id,
          scheduledAt: callback.scheduledAt,
          status: callback.status,
          note: callback.note,
          assigneeName: callback.assigneeName,
        })),
        recentClosed: context.snapshot.callbacks.recentClosed.map((callback) => ({
          id: callback.id,
          scheduledAt: callback.scheduledAt,
          status: callback.status,
          note: callback.note,
          assigneeName: callback.assigneeName,
        })),
      },
      orders: {
        recent: context.snapshot.orders.recent.map((order) => ({
          id: order.id,
          status: order.status,
          note: order.note,
          operatorName: order.operatorName,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          total: order.total,
        })),
      },
      notes: {
        recent: context.snapshot.notes.recent.map((note) => ({
          id: note.id,
          body:
            includeSensitive && options?.includeNoteBodies !== false
              ? note.body
              : "[redacted]",
          authorName: note.authorName,
          createdAt: note.createdAt,
        })),
      },
      products: {
        catalog: context.snapshot.products.catalog.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          categoryName: product.categoryName,
        })),
        purchased: context.snapshot.products.purchased.map((product) => ({
          productId: product.productId,
          productName: product.productName,
          totalQuantity: product.totalQuantity,
          lastPurchasedAt: product.lastPurchasedAt,
        })),
        lastPurchased: context.snapshot.products.lastPurchased
          ? {
              productId: context.snapshot.products.lastPurchased.productId,
              productName: context.snapshot.products.lastPurchased.productName,
              quantity: context.snapshot.products.lastPurchased.quantity,
              unitPrice: context.snapshot.products.lastPurchased.unitPrice,
              purchasedAt: context.snapshot.products.lastPurchased.purchasedAt,
              orderId: context.snapshot.products.lastPurchased.orderId,
            }
          : null,
      },
    },
    history: {
      activities: historyActivities.map((activity) => ({
        id: activity.id,
        kind: activity.kind,
        occurredAt: activity.occurredAt,
        summary: activity.summary,
        payloadVersion: activity.payloadVersion,
        data: activity.data,
        actorName: activity.actorName,
        correlationId: activity.correlationId,
        sourceEntity: activity.sourceEntity,
      })),
    },
    statistics: {
      totalCalls: context.statistics.totalCalls,
      totalOrders: context.statistics.totalOrders,
      totalOpenCallbacks: context.statistics.totalOpenCallbacks,
      totalNotes: context.statistics.totalNotes,
      failCount: context.statistics.failCount,
      successfulOrderCount: context.statistics.successfulOrderCount,
    },
  };
}

export function serializeContactAiContext(
  context: ContactAiContext,
  options?: SerializeContactAiContextOptions,
): string {
  const payload = buildSerializedPayload(context, options);
  return JSON.stringify(payload, null, 2);
}

/** @deprecated Use `serializeContactAiContext` — kept for non-summary stub templates. */
export const serializeContactAiContextForPrompt = serializeContactAiContext;
