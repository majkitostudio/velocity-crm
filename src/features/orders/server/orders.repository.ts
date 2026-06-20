import "server-only";

import { OrderStatus, type Order, type Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type TransactionClient = Prisma.TransactionClient;

export async function createOrderForCompany(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    operatorId: string;
    note?: string | null;
    items: {
      productId: string;
      quantity: number;
      unitPrice: string;
    }[];
  },
): Promise<Order> {
  return tx.order.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      operatorId: input.operatorId,
      status: OrderStatus.CREATED,
      note: input.note ?? null,
      items: {
        create: input.items.map((item) => ({
          companyId: input.companyId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
  });
}

export async function findOrderSummaryByIdForCompany(input: {
  companyId: string;
  orderId: string;
}) {
  return prisma.order.findFirst({
    where: {
      id: input.orderId,
      companyId: input.companyId,
    },
    select: {
      id: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}
