import type {
  CallbackStatus,
  CallOutcome,
  ContactPriority,
  ContactSource,
  ContactStatus,
} from "@/src/generated/prisma/client";

import type { CONTACT_CONTEXT_SCHEMA_VERSION } from "./build-options";
import type { ContactActivityEntry } from "./activity-entry";

export type ContactProfile = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: {
    street: string | null;
    city: string | null;
    zipCode: string | null;
    country: string | null;
  };
  status: ContactStatus;
  source: ContactSource;
  priority: ContactPriority;
  assignedUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactWorkflowSnapshot = {
  failCount: number;
  failThreshold: number;
  lastCall: {
    id: string;
    outcome: CallOutcome;
    operatorName: string | null;
    createdAt: Date;
    note: string | null;
  } | null;
};

export type ContactCallbackSnapshot = {
  id: string;
  scheduledAt: Date;
  status: CallbackStatus;
  note: string | null;
  assigneeName: string | null;
};

export type ContactCallbacksSnapshot = {
  open: readonly ContactCallbackSnapshot[];
  recentClosed: readonly ContactCallbackSnapshot[];
};

export type ContactOrderItemSnapshot = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
};

export type ContactOrderSnapshot = {
  id: string;
  status: string;
  note: string | null;
  operatorName: string | null;
  createdAt: Date;
  items: readonly ContactOrderItemSnapshot[];
  total: string;
};

export type ContactOrdersSnapshot = {
  recent: readonly ContactOrderSnapshot[];
};

export type ContactNoteSnapshot = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: Date;
};

export type ContactNotesSnapshot = {
  recent: readonly ContactNoteSnapshot[];
};

export type ContactProductCatalogEntry = {
  id: string;
  name: string;
  price: string;
  categoryName: string | null;
};

export type ContactPurchasedProduct = {
  productId: string;
  productName: string;
  totalQuantity: number;
  lastPurchasedAt: Date;
};

export type ContactLastPurchasedProduct = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  purchasedAt: Date;
  orderId: string;
};

export type ContactProductsSnapshot = {
  catalog: readonly ContactProductCatalogEntry[];
  purchased: readonly ContactPurchasedProduct[];
  lastPurchased: ContactLastPurchasedProduct | null;
};

export type ContactSnapshot = {
  workflow: ContactWorkflowSnapshot;
  callbacks: ContactCallbacksSnapshot;
  orders: ContactOrdersSnapshot;
  notes: ContactNotesSnapshot;
  products: ContactProductsSnapshot;
};

export type ContactHistory = {
  activities: readonly ContactActivityEntry[];
};

export type ContactStatistics = {
  totalCalls: number;
  totalOrders: number;
  totalOpenCallbacks: number;
  totalNotes: number;
  failCount: number;
  successfulOrderCount: number;
};

export type ContactContextMetadata = {
  generatedAt: string;
  generatedFromActivityId: string | null;
  providerVersions?: Readonly<Partial<Record<string, number>>>;
};

export type ContactContext = {
  readonly schemaVersion: typeof CONTACT_CONTEXT_SCHEMA_VERSION;
  readonly contactId: string;
  readonly companyId: string;
  readonly contact: ContactProfile;
  readonly snapshot: ContactSnapshot;
  readonly history: ContactHistory;
  readonly statistics: ContactStatistics;
  readonly metadata?: ContactContextMetadata;
};
