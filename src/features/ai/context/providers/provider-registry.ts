import { activityContextProvider } from "./activity-context.provider";
import { callbacksContextProvider } from "./callbacks-context.provider";
import { contactContextProvider } from "./contact-context.provider";
import { notesContextProvider } from "./notes-context.provider";
import { ordersContextProvider } from "./orders-context.provider";
import { productsContextProvider } from "./products-context.provider";
import type {
  AnyContactContextProvider,
  ContactContextProviderKey,
} from "../types/contact-context-provider";

export const contactContextProviderRegistry: readonly AnyContactContextProvider[] = [
  activityContextProvider,
  contactContextProvider,
  ordersContextProvider,
  callbacksContextProvider,
  productsContextProvider,
  notesContextProvider,
];

export function resolveProvidersForSections(
  sections: ReadonlySet<import("../types/build-options").ContactAiContextSection>,
): AnyContactContextProvider[] {
  const keys = new Set<ContactContextProviderKey>();

  if (sections.has("contact") || sections.has("snapshot")) {
    keys.add("contact");
  }

  if (sections.has("snapshot")) {
    keys.add("orders");
    keys.add("callbacks");
    keys.add("products");
    keys.add("notes");
  }

  if (sections.has("history")) {
    keys.add("activity");
  }

  if (sections.has("statistics")) {
    keys.add("activity");
    keys.add("contact");
    keys.add("orders");
    keys.add("callbacks");
    keys.add("notes");
  }

  return contactContextProviderRegistry.filter((provider) => keys.has(provider.key));
}
