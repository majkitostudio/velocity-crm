import type {
  CallbackStatus,
  CallOutcome,
  ContactPriority,
  ContactSource,
  ContactStatus,
} from "@/src/generated/prisma/client";

import type { CONTACT_AI_CONTEXT_SCHEMA_VERSION } from "./build-options";
import type { ContactAiActivityEntry } from "./activity-entry";

export type ContactAiProfile = {
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
  createdAt: string;
  updatedAt: string;
};

export type ContactAiWorkflowSnapshot = {
  failCount: number;
  failThreshold: number;
  lastCall: {
    id: string;
    outcome: CallOutcome;
    operatorName: string | null;
    createdAt: string;
    note: string | null;
  } | null;
};

export type ContactAiCallbackSnapshot = {
  id: string;
  scheduledAt: string;
  status: CallbackStatus;
  note: string | null;
  assigneeName: string | null;
};

export type ContactAiCallbacksSnapshot = {
  open: readonly ContactAiCallbackSnapshot[];
  recentClosed: readonly ContactAiCallbackSnapshot[];
};

export type ContactAiOrderItemSnapshot = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
};

export type ContactAiOrderSnapshot = {
  id: string;
  status: string;
  note: string | null;
  operatorName: string | null;
  createdAt: string;
  items: readonly ContactAiOrderItemSnapshot[];
  total: string;
};

export type ContactAiOrdersSnapshot = {
  recent: readonly ContactAiOrderSnapshot[];
};

export type ContactAiNoteSnapshot = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

export type ContactAiNotesSnapshot = {
  recent: readonly ContactAiNoteSnapshot[];
};

export type ContactAiProductCatalogEntry = {
  id: string;
  name: string;
  price: string;
  categoryName: string | null;
};

export type ContactAiPurchasedProduct = {
  productId: string;
  productName: string;
  totalQuantity: number;
  lastPurchasedAt: string;
};

export type ContactAiLastPurchasedProduct = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  purchasedAt: string;
  orderId: string;
};

export type ContactAiProductsSnapshot = {
  catalog: readonly ContactAiProductCatalogEntry[];
  purchased: readonly ContactAiPurchasedProduct[];
  lastPurchased: ContactAiLastPurchasedProduct | null;
};

export type ContactAiSnapshot = {
  workflow: ContactAiWorkflowSnapshot;
  callbacks: ContactAiCallbacksSnapshot;
  orders: ContactAiOrdersSnapshot;
  notes: ContactAiNotesSnapshot;
  products: ContactAiProductsSnapshot;
};

export type ContactAiHistory = {
  activities: readonly ContactAiActivityEntry[];
};

export type ContactAiStatistics = {
  totalCalls: number;
  totalOrders: number;
  totalOpenCallbacks: number;
  totalNotes: number;
  failCount: number;
  successfulOrderCount: number;
};

export type ContactAiContextMetadata = {
  generatedAt: string;
  generatedFromActivityId: string | null;
  providerVersions?: Readonly<Partial<Record<string, number>>>;
};

export type ContactAiContext = {
  readonly schemaVersion: typeof CONTACT_AI_CONTEXT_SCHEMA_VERSION;
  readonly contactId: string;
  readonly companyId: string;
  readonly contact: ContactAiProfile;
  readonly snapshot: ContactAiSnapshot;
  readonly history: ContactAiHistory;
  readonly statistics: ContactAiStatistics;
  readonly metadata?: ContactAiContextMetadata;
};

export type EmptyContactAiContext = Pick<
  ContactAiContext,
  "schemaVersion" | "contactId" | "companyId"
>;
