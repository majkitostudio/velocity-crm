import type { ResolvedBuildContactAiContextOptions } from "./build-options";

export type ContactContextProviderInput = {
  companyId: string;
  contactId: string;
};

export type ContactContextProviderKey =
  | "activity"
  | "contact"
  | "orders"
  | "callbacks"
  | "products"
  | "notes";

export type ContactContextProviderResultMap = {
  activity: import("./provider-results").ActivityContextProviderResult;
  contact: import("./provider-results").ContactContextProviderResult;
  orders: import("./provider-results").OrdersContextProviderResult;
  callbacks: import("./provider-results").CallbacksContextProviderResult;
  products: import("./provider-results").ProductsContextProviderResult;
  notes: import("./provider-results").NotesContextProviderResult;
};

export type ContactContextProvider<K extends ContactContextProviderKey> = {
  readonly key: K;
  /** Per-provider schema version for future evolution (ADR-010). */
  readonly version: number;
  provide(
    input: ContactContextProviderInput,
    options: ResolvedBuildContactAiContextOptions,
  ): Promise<ContactContextProviderResultMap[K]>;
};

export type AnyContactContextProvider = {
  [K in ContactContextProviderKey]: ContactContextProvider<K>;
}[ContactContextProviderKey];

export type ContactContextProviderOutputs = {
  [K in ContactContextProviderKey]?: ContactContextProviderResultMap[K];
};
