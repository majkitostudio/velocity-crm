import "server-only";

import {
  CallbackStatus,
  ContactPriority,
  ContactSource,
  ContactStatus,
  type CallOutcome,
  type Prisma,
} from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

import type { ListContactsSort } from "../schemas";

const contactListSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
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

export type ContactListRow = Prisma.ContactGetPayload<{
  select: typeof contactListSelect;
}>;

export type ContactListWhere = {
  companyId: string;
  assignedUserId?: string | null;
  status?: ContactStatus;
  source?: ContactSource;
  priority?: ContactPriority;
  searchQuery?: string;
  contactIds?: string[];
};

function buildSearchWhere(searchQuery: string): Prisma.ContactWhereInput {
  return {
    OR: [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { phone: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
    ],
  };
}

function buildWhere(input: ContactListWhere): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = {
    companyId: input.companyId,
  };

  if (input.assignedUserId !== undefined) {
    where.assignedUserId = input.assignedUserId;
  }

  if (input.status) {
    where.status = input.status;
  }

  if (input.source) {
    where.source = input.source;
  }

  if (input.priority) {
    where.priority = input.priority;
  }

  if (input.contactIds !== undefined) {
    where.id = { in: input.contactIds };
  }

  if (input.searchQuery) {
    return {
      AND: [where, buildSearchWhere(input.searchQuery)],
    };
  }

  return where;
}

function buildOrderBy(sort: ListContactsSort): Prisma.ContactOrderByWithRelationInput[] {
  switch (sort) {
    case "created_asc":
      return [{ createdAt: "asc" }];
    case "created_desc":
      return [{ createdAt: "desc" }];
    case "updated_desc":
      return [{ updatedAt: "desc" }];
    case "priority_desc":
    default:
      return [{ priority: "desc" }, { createdAt: "asc" }];
  }
}

export async function countContactsForCompany(
  whereInput: ContactListWhere,
): Promise<number> {
  return prisma.contact.count({
    where: buildWhere(whereInput),
  });
}

export async function listContactsForCompany(input: {
  where: ContactListWhere;
  sort: ListContactsSort;
  skip: number;
  take: number;
}): Promise<ContactListRow[]> {
  return prisma.contact.findMany({
    where: buildWhere(input.where),
    orderBy: buildOrderBy(input.sort),
    skip: input.skip,
    take: input.take,
    select: contactListSelect,
  });
}

export async function findLatestCallsForContacts(input: {
  companyId: string;
  contactIds: string[];
}): Promise<
  Map<
    string,
    {
      outcome: CallOutcome;
      createdAt: Date;
    }
  >
> {
  if (input.contactIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.callActivity.findMany({
    where: {
      companyId: input.companyId,
      contactId: { in: input.contactIds },
    },
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["contactId"],
    select: {
      contactId: true,
      outcome: true,
      createdAt: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.contactId,
      {
        outcome: row.outcome,
        createdAt: row.createdAt,
      },
    ]),
  );
}

export async function findNextOpenCallbacksForContacts(input: {
  companyId: string;
  contactIds: string[];
}): Promise<Map<string, Date>> {
  if (input.contactIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.callback.findMany({
    where: {
      companyId: input.companyId,
      contactId: { in: input.contactIds },
      status: CallbackStatus.OPEN,
    },
    orderBy: {
      scheduledAt: "asc",
    },
    distinct: ["contactId"],
    select: {
      contactId: true,
      scheduledAt: true,
    },
  });

  return new Map(rows.map((row) => [row.contactId, row.scheduledAt]));
}
