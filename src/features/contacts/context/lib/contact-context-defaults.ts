import { deepFreeze } from "@/src/domain/deep-freeze";

import type {
  ContactCallbacksSnapshot,
  ContactContext,
  ContactHistory,
  ContactNotesSnapshot,
  ContactOrdersSnapshot,
  ContactProductsSnapshot,
  ContactProfile,
  ContactSnapshot,
  ContactStatistics,
  ContactWorkflowSnapshot,
} from "../types/contact-context";

export function createEmptyContactProfile(contactId: string): ContactProfile {
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
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

export const EMPTY_WORKFLOW_SNAPSHOT: ContactWorkflowSnapshot = {
  failCount: 0,
  failThreshold: 0,
  lastCall: null,
};

export const EMPTY_CALLBACKS_SNAPSHOT: ContactCallbacksSnapshot = {
  open: [],
  recentClosed: [],
};

export const EMPTY_ORDERS_SNAPSHOT: ContactOrdersSnapshot = {
  recent: [],
};

export const EMPTY_NOTES_SNAPSHOT: ContactNotesSnapshot = {
  recent: [],
};

export const EMPTY_PRODUCTS_SNAPSHOT: ContactProductsSnapshot = {
  catalog: [],
  purchased: [],
  lastPurchased: null,
};

export const EMPTY_HISTORY: ContactHistory = {
  activities: [],
};

export const EMPTY_STATISTICS: ContactStatistics = {
  totalCalls: 0,
  totalOrders: 0,
  totalOpenCallbacks: 0,
  totalNotes: 0,
  failCount: 0,
  successfulOrderCount: 0,
};

export function createEmptySnapshot(): ContactSnapshot {
  return {
    workflow: EMPTY_WORKFLOW_SNAPSHOT,
    callbacks: EMPTY_CALLBACKS_SNAPSHOT,
    orders: EMPTY_ORDERS_SNAPSHOT,
    notes: EMPTY_NOTES_SNAPSHOT,
    products: EMPTY_PRODUCTS_SNAPSHOT,
  };
}

export function freezeContactContext(context: ContactContext): ContactContext {
  return deepFreeze(context);
}
