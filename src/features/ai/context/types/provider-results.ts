import type { ContactAiActivityEntry } from "./activity-entry";
import type {
  ContactAiCallbacksSnapshot,
  ContactAiNotesSnapshot,
  ContactAiOrdersSnapshot,
  ContactAiProductsSnapshot,
  ContactAiProfile,
  ContactAiWorkflowSnapshot,
} from "./contact-ai-context";

export type ActivityContextProviderAggregates = {
  totalActivityCount: number;
  callFinishedCount: number;
};

export type ActivityContextProviderResult = {
  activities: readonly ContactAiActivityEntry[];
  aggregates: ActivityContextProviderAggregates;
};

export type ContactContextProviderAggregates = {
  failCount: number;
};

export type ContactContextProviderResult = {
  contact: ContactAiProfile;
  workflow: ContactAiWorkflowSnapshot;
  aggregates: ContactContextProviderAggregates;
};

export type OrdersContextProviderAggregates = {
  totalOrderCount: number;
  successfulOrderCount: number;
};

export type OrdersContextProviderResult = {
  orders: ContactAiOrdersSnapshot;
  aggregates: OrdersContextProviderAggregates;
};

export type CallbacksContextProviderAggregates = {
  openCount: number;
};

export type CallbacksContextProviderResult = {
  callbacks: ContactAiCallbacksSnapshot;
  aggregates: CallbacksContextProviderAggregates;
};

export type ProductsContextProviderResult = {
  products: ContactAiProductsSnapshot;
};

export type NotesContextProviderAggregates = {
  totalNoteCount: number;
};

export type NotesContextProviderResult = {
  notes: ContactAiNotesSnapshot;
  aggregates: NotesContextProviderAggregates;
};

export type ContactContextProviderAggregatesMap = {
  activity: ActivityContextProviderAggregates;
  contact: ContactContextProviderAggregates;
  orders: OrdersContextProviderAggregates;
  callbacks: CallbacksContextProviderAggregates;
  notes: NotesContextProviderAggregates;
};
