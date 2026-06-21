import "server-only";

import type { ContactActivityKind, Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

import type { ActivityTimelineCursor } from "../lib/activity-timeline-schemas";

export type ListContactActivitiesInput = {
  companyId: string;
  contactId: string;
  kinds?: ContactActivityKind[];
  occurredAtFrom?: Date;
  occurredAtTo?: Date;
  cursor?: ActivityTimelineCursor | null;
  limit: number;
};

export type ContactActivityReadRow = {
  id: string;
  kind: ContactActivityKind;
  occurredAt: Date;
  payload: Prisma.JsonValue;
  actor: {
    name: string | null;
    email: string;
  } | null;
};

function buildCursorFilter(
  cursor: ActivityTimelineCursor,
): Prisma.ContactActivityWhereInput {
  return {
    OR: [
      {
        occurredAt: {
          lt: cursor.occurredAt,
        },
      },
      {
        occurredAt: cursor.occurredAt,
        id: {
          lt: cursor.id,
        },
      },
    ],
  };
}

export async function listContactActivitiesForTimeline(
  input: ListContactActivitiesInput,
): Promise<ContactActivityReadRow[]> {
  const where: Prisma.ContactActivityWhereInput = {
    companyId: input.companyId,
    contactId: input.contactId,
    ...(input.kinds && input.kinds.length > 0
      ? { kind: { in: input.kinds } }
      : {}),
    ...(input.occurredAtFrom || input.occurredAtTo
      ? {
          occurredAt: {
            ...(input.occurredAtFrom ? { gte: input.occurredAtFrom } : {}),
            ...(input.occurredAtTo ? { lte: input.occurredAtTo } : {}),
          },
        }
      : {}),
    ...(input.cursor ? buildCursorFilter(input.cursor) : {}),
  };

  return prisma.contactActivity.findMany({
    where,
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: input.limit,
    select: {
      id: true,
      kind: true,
      occurredAt: true,
      payload: true,
      actor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}
