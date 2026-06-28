import "server-only";

import {
  CallOutcome,
  OrderStatus,
  UserRole,
  type Prisma,
} from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type DateRange = {
  from: Date;
  to: Date;
};

function callActivityDateFilter(range: DateRange): Prisma.CallActivityWhereInput {
  return {
    createdAt: {
      gte: range.from,
      lte: range.to,
    },
  };
}

function orderDateFilter(range: DateRange): Prisma.OrderWhereInput {
  return {
    createdAt: {
      gte: range.from,
      lte: range.to,
    },
    status: {
      not: OrderStatus.CANCELLED,
    },
  };
}

export async function findOperatorsForReporting(companyId: string) {
  return prisma.user.findMany({
    where: {
      companyId,
      role: UserRole.OPERATOR,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });
}

export async function findCallOutcomeCountsForCompany(input: {
  companyId: string;
  range: DateRange;
}) {
  return prisma.callActivity.groupBy({
    by: ["outcome"],
    where: {
      companyId: input.companyId,
      ...callActivityDateFilter(input.range),
    },
    _count: {
      _all: true,
    },
  });
}

export async function findCallCountsByOperatorForCompany(input: {
  companyId: string;
  range: DateRange;
}) {
  return prisma.callActivity.groupBy({
    by: ["operatorId"],
    where: {
      companyId: input.companyId,
      ...callActivityDateFilter(input.range),
    },
    _count: {
      _all: true,
    },
  });
}

export async function findOrderOutcomeCountsByOperatorForCompany(input: {
  companyId: string;
  range: DateRange;
}) {
  return prisma.callActivity.groupBy({
    by: ["operatorId"],
    where: {
      companyId: input.companyId,
      outcome: CallOutcome.ORDER,
      ...callActivityDateFilter(input.range),
    },
    _count: {
      _all: true,
    },
  });
}

export async function findOrdersWithItemsForCompany(input: {
  companyId: string;
  range: DateRange;
}) {
  return prisma.order.findMany({
    where: {
      companyId: input.companyId,
      ...orderDateFilter(input.range),
    },
    select: {
      operatorId: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });
}
