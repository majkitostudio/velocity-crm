import type { ContactActivityEntry } from "./activity-entry";
import type {
  ContactCallbacksSnapshot,
  ContactNotesSnapshot,
  ContactOrdersSnapshot,
  ContactProductsSnapshot,
  ContactProfile,
  ContactWorkflowSnapshot,
} from "./contact-context";

export type ActivityContextProviderAggregates = {
  totalActivityCount: number;
  callFinishedCount: number;
};

export type ActivityContextProviderResult = {
  activities: readonly ContactActivityEntry[];
  aggregates: ActivityContextProviderAggregates;
};

export type ContactContextProviderAggregates = {
  failCount: number;
};

export type ContactContextProviderResult = {
  contact: ContactProfile;
  workflow: ContactWorkflowSnapshot;
  aggregates: ContactContextProviderAggregates;
};

export type OrdersContextProviderAggregates = {
  totalOrderCount: number;
  successfulOrderCount: number;
};

export type OrdersContextProviderResult = {
  orders: ContactOrdersSnapshot;
  aggregates: OrdersContextProviderAggregates;
};

export type CallbacksContextProviderAggregates = {
  openCount: number;
};

export type CallbacksContextProviderResult = {
  callbacks: ContactCallbacksSnapshot;
  aggregates: CallbacksContextProviderAggregates;
};

export type ProductsContextProviderResult = {
  products: ContactProductsSnapshot;
};

export type NotesContextProviderAggregates = {
  totalNoteCount: number;
};

export type NotesContextProviderResult = {
  notes: ContactNotesSnapshot;
  aggregates: NotesContextProviderAggregates;
};

export type ContactContextProviderAggregatesMap = {
  activity: ActivityContextProviderAggregates;
  contact: ContactContextProviderAggregates;
  orders: OrdersContextProviderAggregates;
  callbacks: CallbacksContextProviderAggregates;
  notes: NotesContextProviderAggregates;
};
