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
import type { ContactContextSection } from "../types/build-options";

export const contactContextProviderRegistry: readonly AnyContactContextProvider[] = [
  activityContextProvider,
  contactContextProvider,
  ordersContextProvider,
  callbacksContextProvider,
  productsContextProvider,
  notesContextProvider,
];

function sectionRequiresProvider(
  section: ContactContextSection,
  key: ContactContextProviderKey,
): boolean {
  switch (key) {
    case "contact":
      return section === "contact" || section === "snapshot.workflow" || section === "statistics";
    case "callbacks":
      return section === "snapshot.callbacks" || section === "statistics";
    case "notes":
      return section === "snapshot.notes" || section === "statistics";
    case "orders":
      return section === "snapshot.orders" || section === "statistics";
    case "products":
      return section === "snapshot.products";
    case "activity":
      return section === "history" || section === "statistics";
    default:
      return false;
  }
}

export function resolveProvidersForSections(
  sections: ReadonlySet<ContactContextSection>,
): AnyContactContextProvider[] {
  const keys = new Set<ContactContextProviderKey>();

  for (const section of sections) {
    for (const provider of contactContextProviderRegistry) {
      if (sectionRequiresProvider(section, provider.key)) {
        keys.add(provider.key);
      }
    }
  }

  return contactContextProviderRegistry.filter((provider) => keys.has(provider.key));
}

export function hasLoadedSection(
  sections: ReadonlySet<ContactContextSection>,
  section: ContactContextSection,
): boolean {
  return sections.has(section);
}
