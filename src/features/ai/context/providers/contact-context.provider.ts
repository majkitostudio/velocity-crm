import { NotFoundError } from "@/src/domain/errors";
import { FAIL_THRESHOLD } from "@/src/domain/workflow";
import {
  countFailOutcomesForContact,
  findContactDetailByIdForCompany,
  findLatestCallForContact,
} from "@/src/features/contacts/server/contacts.repository";

import { formatAiContextDate } from "../lib/format-ai-context-value";
import type { ContactContextProvider } from "../types/contact-context-provider";
import type { ContactAiProfile } from "../types/contact-ai-context";

export const CONTACT_CONTEXT_PROVIDER_VERSION = 1;

function mapContactProfile(
  contact: NonNullable<Awaited<ReturnType<typeof findContactDetailByIdForCompany>>>,
  includeSensitiveData: boolean,
): ContactAiProfile {
  return {
    id: contact.id,
    name: contact.name,
    phone: includeSensitiveData ? contact.phone : null,
    email: includeSensitiveData ? contact.email : null,
    address: {
      street: contact.street,
      city: contact.city,
      zipCode: contact.zipCode,
      country: contact.country,
    },
    status: contact.status,
    source: contact.source,
    priority: contact.priority,
    assignedUser: contact.assignedUser
      ? {
          id: contact.assignedUser.id,
          name: contact.assignedUser.name,
          email: contact.assignedUser.email,
        }
      : null,
    createdAt: formatAiContextDate(contact.createdAt),
    updatedAt: formatAiContextDate(contact.updatedAt),
  };
}

export const contactContextProvider: ContactContextProvider<"contact"> = {
  key: "contact",
  version: CONTACT_CONTEXT_PROVIDER_VERSION,

  async provide(input, options) {
    const [contact, failCount, lastCall] = await Promise.all([
      findContactDetailByIdForCompany({
        companyId: input.companyId,
        contactId: input.contactId,
      }),
      countFailOutcomesForContact({
        companyId: input.companyId,
        contactId: input.contactId,
      }),
      findLatestCallForContact({
        companyId: input.companyId,
        contactId: input.contactId,
      }),
    ]);

    if (!contact) {
      throw new NotFoundError("Contact not found");
    }

    return {
      contact: mapContactProfile(contact, options.includeSensitiveData),
      workflow: {
        failCount,
        failThreshold: FAIL_THRESHOLD,
        lastCall: lastCall
          ? {
              id: lastCall.id,
              outcome: lastCall.outcome,
              operatorName: lastCall.operator.name,
              createdAt: formatAiContextDate(lastCall.createdAt),
              note: options.includeSensitiveData ? lastCall.note : null,
            }
          : null,
      },
      aggregates: {
        failCount,
      },
    };
  },
};
