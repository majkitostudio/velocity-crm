import { deepFreeze } from "@/src/domain/deep-freeze";
import type { ContactActivityEntry } from "@/src/features/contacts/context/types/activity-entry";
import type {
  ContactCallbackSnapshot,
  ContactCallbacksSnapshot,
  ContactContext,
  ContactHistory,
  ContactLastPurchasedProduct,
  ContactNoteSnapshot,
  ContactNotesSnapshot,
  ContactOrderItemSnapshot,
  ContactOrderSnapshot,
  ContactOrdersSnapshot,
  ContactProductCatalogEntry,
  ContactProductsSnapshot,
  ContactProfile,
  ContactPurchasedProduct,
  ContactSnapshot,
  ContactStatistics,
  ContactWorkflowSnapshot,
} from "@/src/features/contacts/context/types/contact-context";

import { CONTACT_AI_CONTEXT_SCHEMA_VERSION } from "../types/build-options";
import type { ContactAiActivityEntry } from "../types/activity-entry";
import type {
  ContactAiCallbackSnapshot,
  ContactAiCallbacksSnapshot,
  ContactAiContext,
  ContactAiContextMetadata,
  ContactAiHistory,
  ContactAiLastPurchasedProduct,
  ContactAiNoteSnapshot,
  ContactAiNotesSnapshot,
  ContactAiOrderItemSnapshot,
  ContactAiOrderSnapshot,
  ContactAiOrdersSnapshot,
  ContactAiProductCatalogEntry,
  ContactAiProductsSnapshot,
  ContactAiProfile,
  ContactAiPurchasedProduct,
  ContactAiSnapshot,
  ContactAiStatistics,
  ContactAiWorkflowSnapshot,
} from "../types/contact-ai-context";

function formatDate(value: Date): string {
  return value.toISOString();
}

function mapProfile(profile: ContactProfile): ContactAiProfile {
  return {
    id: profile.id,
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    address: { ...profile.address },
    status: profile.status,
    source: profile.source,
    priority: profile.priority,
    assignedUser: profile.assignedUser ? { ...profile.assignedUser } : null,
    createdAt: formatDate(profile.createdAt),
    updatedAt: formatDate(profile.updatedAt),
  };
}

function mapWorkflow(workflow: ContactWorkflowSnapshot): ContactAiWorkflowSnapshot {
  return {
    failCount: workflow.failCount,
    failThreshold: workflow.failThreshold,
    lastCall: workflow.lastCall
      ? {
          id: workflow.lastCall.id,
          outcome: workflow.lastCall.outcome,
          operatorName: workflow.lastCall.operatorName,
          createdAt: formatDate(workflow.lastCall.createdAt),
          note: workflow.lastCall.note,
        }
      : null,
  };
}

function mapCallback(callback: ContactCallbackSnapshot): ContactAiCallbackSnapshot {
  return {
    id: callback.id,
    scheduledAt: formatDate(callback.scheduledAt),
    status: callback.status,
    note: callback.note,
    assigneeName: callback.assigneeName,
  };
}

function mapCallbacks(callbacks: ContactCallbacksSnapshot): ContactAiCallbacksSnapshot {
  return {
    open: callbacks.open.map(mapCallback),
    recentClosed: callbacks.recentClosed.map(mapCallback),
  };
}

function mapOrderItem(item: ContactOrderItemSnapshot): ContactAiOrderItemSnapshot {
  return { ...item };
}

function mapOrder(order: ContactOrderSnapshot): ContactAiOrderSnapshot {
  return {
    id: order.id,
    status: order.status,
    note: order.note,
    operatorName: order.operatorName,
    createdAt: formatDate(order.createdAt),
    items: order.items.map(mapOrderItem),
    total: order.total,
  };
}

function mapOrders(orders: ContactOrdersSnapshot): ContactAiOrdersSnapshot {
  return {
    recent: orders.recent.map(mapOrder),
  };
}

function mapNote(note: ContactNoteSnapshot): ContactAiNoteSnapshot {
  return {
    id: note.id,
    body: note.body,
    authorName: note.authorName,
    createdAt: formatDate(note.createdAt),
  };
}

function mapNotes(notes: ContactNotesSnapshot): ContactAiNotesSnapshot {
  return {
    recent: notes.recent.map(mapNote),
  };
}

function mapCatalogEntry(
  entry: ContactProductCatalogEntry,
): ContactAiProductCatalogEntry {
  return { ...entry };
}

function mapPurchasedProduct(
  product: ContactPurchasedProduct,
): ContactAiPurchasedProduct {
  return {
    productId: product.productId,
    productName: product.productName,
    totalQuantity: product.totalQuantity,
    lastPurchasedAt: formatDate(product.lastPurchasedAt),
  };
}

function mapLastPurchased(
  product: ContactLastPurchasedProduct,
): ContactAiLastPurchasedProduct {
  return {
    productId: product.productId,
    productName: product.productName,
    quantity: product.quantity,
    unitPrice: product.unitPrice,
    purchasedAt: formatDate(product.purchasedAt),
    orderId: product.orderId,
  };
}

function mapProducts(products: ContactProductsSnapshot): ContactAiProductsSnapshot {
  return {
    catalog: products.catalog.map(mapCatalogEntry),
    purchased: products.purchased.map(mapPurchasedProduct),
    lastPurchased: products.lastPurchased
      ? mapLastPurchased(products.lastPurchased)
      : null,
  };
}

function mapSnapshot(snapshot: ContactSnapshot): ContactAiSnapshot {
  return {
    workflow: mapWorkflow(snapshot.workflow),
    callbacks: mapCallbacks(snapshot.callbacks),
    orders: mapOrders(snapshot.orders),
    notes: mapNotes(snapshot.notes),
    products: mapProducts(snapshot.products),
  };
}

function mapActivityEntry(entry: ContactActivityEntry): ContactAiActivityEntry {
  return {
    id: entry.id,
    kind: entry.kind,
    occurredAt: formatDate(entry.occurredAt),
    summary: entry.summary,
    payloadVersion: entry.payloadVersion,
    data: entry.data,
    actorName: entry.actorName,
    correlationId: entry.correlationId,
    sourceEntity: entry.sourceEntity ? { ...entry.sourceEntity } : null,
  } as ContactAiActivityEntry;
}

function mapHistory(history: ContactHistory): ContactAiHistory {
  return {
    activities: history.activities.map(mapActivityEntry),
  };
}

function mapStatistics(statistics: ContactStatistics): ContactAiStatistics {
  return { ...statistics };
}

function mapMetadata(
  metadata: ContactContext["metadata"],
): ContactAiContextMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  return {
    generatedAt: metadata.generatedAt,
    generatedFromActivityId: metadata.generatedFromActivityId,
    providerVersions: metadata.providerVersions
      ? { ...metadata.providerVersions }
      : undefined,
  };
}

export function freezeContactAiContext(context: ContactAiContext): ContactAiContext {
  return deepFreeze(context);
}

export function toContactAiContext(context: ContactContext): ContactAiContext {
  const aiContext: ContactAiContext = {
    schemaVersion: CONTACT_AI_CONTEXT_SCHEMA_VERSION,
    contactId: context.contactId,
    companyId: context.companyId,
    contact: mapProfile(context.contact),
    snapshot: mapSnapshot(context.snapshot),
    history: mapHistory(context.history),
    statistics: mapStatistics(context.statistics),
    metadata: mapMetadata(context.metadata),
  };

  return freezeContactAiContext(aiContext);
}
