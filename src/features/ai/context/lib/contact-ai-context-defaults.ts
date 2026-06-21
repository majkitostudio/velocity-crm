import type {
  ContactAiCallbacksSnapshot,
  ContactAiContext,
  ContactAiHistory,
  ContactAiNotesSnapshot,
  ContactAiOrdersSnapshot,
  ContactAiProductsSnapshot,
  ContactAiProfile,
  ContactAiSnapshot,
  ContactAiStatistics,
  ContactAiWorkflowSnapshot,
} from "../types/contact-ai-context";

export function createEmptyContactAiProfile(
  contactId: string,
): ContactAiProfile {
  return {
    id: contactId,
    name: "",
    phone: null,
    email: null,
    address: {
      street: null,
      city: null,
      zipCode: null,
      country: null,
    },
    status: "LEAD",
    source: "MANUAL",
    priority: "NORMAL",
    assignedUser: null,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

export const EMPTY_WORKFLOW_SNAPSHOT: ContactAiWorkflowSnapshot = {
  failCount: 0,
  failThreshold: 0,
  lastCall: null,
};

export const EMPTY_CALLBACKS_SNAPSHOT: ContactAiCallbacksSnapshot = {
  open: [],
  recentClosed: [],
};

export const EMPTY_ORDERS_SNAPSHOT: ContactAiOrdersSnapshot = {
  recent: [],
};

export const EMPTY_NOTES_SNAPSHOT: ContactAiNotesSnapshot = {
  recent: [],
};

export const EMPTY_PRODUCTS_SNAPSHOT: ContactAiProductsSnapshot = {
  catalog: [],
  purchased: [],
  lastPurchased: null,
};

export const EMPTY_HISTORY: ContactAiHistory = {
  activities: [],
};

export const EMPTY_STATISTICS: ContactAiStatistics = {
  totalCalls: 0,
  totalOrders: 0,
  totalOpenCallbacks: 0,
  totalNotes: 0,
  failCount: 0,
  successfulOrderCount: 0,
};

export function createEmptySnapshot(): ContactAiSnapshot {
  return {
    workflow: EMPTY_WORKFLOW_SNAPSHOT,
    callbacks: EMPTY_CALLBACKS_SNAPSHOT,
    orders: EMPTY_ORDERS_SNAPSHOT,
    notes: EMPTY_NOTES_SNAPSHOT,
    products: EMPTY_PRODUCTS_SNAPSHOT,
  };
}

function deepFreeze<T extends object>(value: T): Readonly<T> {
  Object.freeze(value);

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
      deepFreeze(nested);
    }
  }

  return value;
}

export function freezeContactAiContext(context: ContactAiContext): ContactAiContext {
  return deepFreeze(context);
}
