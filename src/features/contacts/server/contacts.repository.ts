import "server-only";

import {
  CallOutcome,
  ContactStatus,
  type Contact,
  type Prisma,
} from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

import type { ContactDetailContact } from "../types";

type TransactionClient = Prisma.TransactionClient;

const contactDetailSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  street: true,
  city: true,
  zipCode: true,
  country: true,
  status: true,
  source: true,
  priority: true,
  assignedUserId: true,
  createdAt: true,
  updatedAt: true,
  assignedUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export async function findContactDetailByIdForCompany(input: {
  companyId: string;
  contactId: string;
}): Promise<ContactDetailContact | null> {
  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      companyId: input.companyId,
    },
    select: contactDetailSelect,
  });

  if (!contact) {
    return null;
  }

  return contact;
}

export async function findContactByIdForCompany(input: {
  companyId: string;
  contactId: string;
}): Promise<Contact | null> {
  return prisma.contact.findFirst({
    where: {
      id: input.contactId,
      companyId: input.companyId,
    },
  });
}

export async function countFailOutcomesForContact(input: {
  companyId: string;
  contactId: string;
}): Promise<number> {
  return prisma.callActivity.count({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
      outcome: CallOutcome.FAIL,
    },
  });
}

export async function countFailOutcomesForContactInTransaction(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
  },
): Promise<number> {
  return tx.callActivity.count({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
      outcome: CallOutcome.FAIL,
    },
  });
}

export async function updateContactStatusForCompany(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    status: ContactStatus;
  },
): Promise<Contact> {
  return tx.contact.update({
    where: {
      id: input.contactId,
      companyId: input.companyId,
    },
    data: {
      status: input.status,
    },
  });
}

export async function findLatestCallForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.callActivity.findFirst({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      outcome: true,
      createdAt: true,
      operator: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function findOpenCallbacksForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.callback.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
      status: "OPEN",
    },
    orderBy: {
      scheduledAt: "asc",
    },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      note: true,
    },
  });
}

export type ExistingContactLookup = {
  phones: Set<string>;
  emails: Set<string>;
};

export async function findExistingContactsByPhonesAndEmails(input: {
  companyId: string;
  phones: string[];
  emails: string[];
}): Promise<ExistingContactLookup> {
  const uniquePhones = [...new Set(input.phones.filter(Boolean))];
  const uniqueEmails = [...new Set(input.emails.filter(Boolean))];

  if (uniquePhones.length === 0 && uniqueEmails.length === 0) {
    return { phones: new Set(), emails: new Set() };
  }

  const conditions = [
    uniquePhones.length > 0 ? { phone: { in: uniquePhones } } : null,
    uniqueEmails.length > 0 ? { email: { in: uniqueEmails } } : null,
  ].filter((condition): condition is { phone: { in: string[] } } | { email: { in: string[] } } =>
    Boolean(condition),
  );

  const contacts = await prisma.contact.findMany({
    where: {
      companyId: input.companyId,
      OR: conditions,
    },
    select: {
      phone: true,
      email: true,
    },
  });

  return {
    phones: new Set(contacts.map((contact) => contact.phone).filter(Boolean) as string[]),
    emails: new Set(contacts.map((contact) => contact.email).filter(Boolean) as string[]),
  };
}

export async function findContactDuplicateInCompany(input: {
  companyId: string;
  phone?: string | null;
  email?: string | null;
}): Promise<Contact | null> {
  const duplicateConditions = [
    input.phone ? { phone: input.phone } : null,
    input.email ? { email: input.email.toLowerCase() } : null,
  ].filter((condition): condition is { phone: string } | { email: string } =>
    Boolean(condition),
  );

  if (duplicateConditions.length === 0) {
    return null;
  }

  return prisma.contact.findFirst({
    where: {
      companyId: input.companyId,
      OR: duplicateConditions,
    },
  });
}

export async function createContactForCompany(
  client: typeof prisma | TransactionClient,
  input: {
    companyId: string;
    data: {
      assignedUserId?: string | null;
      status?: ContactStatus;
      source?: Contact["source"];
      priority?: Contact["priority"];
      name: string;
      phone?: string | null;
      email?: string | null;
      street?: string | null;
      city?: string | null;
      zipCode?: string | null;
      country?: string | null;
    };
  },
): Promise<Contact> {
  return client.contact.create({
    data: {
      companyId: input.companyId,
      assignedUserId: input.data.assignedUserId ?? null,
      status: input.data.status,
      source: input.data.source,
      priority: input.data.priority,
      name: input.data.name,
      phone: input.data.phone ?? null,
      email: input.data.email ? input.data.email.toLowerCase() : null,
      street: input.data.street ?? null,
      city: input.data.city ?? null,
      zipCode: input.data.zipCode ?? null,
      country: input.data.country ?? null,
    },
  });
}
