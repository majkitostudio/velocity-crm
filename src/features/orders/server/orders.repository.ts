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

const orderAiContextSelect = {
  id: true,
  status: true,
  note: true,
  createdAt: true,
  operator: {
    select: {
      name: true,
    },
  },
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
} as const;

export async function listRecentOrdersForContact(input: {
  companyId: string;
  contactId: string;
  limit: number;
}) {
  return prisma.order.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit,
    select: orderAiContextSelect,
  });
}

export async function countOrdersForContact(input: {
  companyId: string;
  contactId: string;
}): Promise<number> {
  return prisma.order.count({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
  });
}

export type ContactPurchasedOrderItemRow = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  orderId: string;
  purchasedAt: Date;
};

export async function listPurchasedOrderItemsForContact(input: {
  companyId: string;
  contactId: string;
}): Promise<ContactPurchasedOrderItemRow[]> {
  const items = await prisma.orderItem.findMany({
    where: {
      companyId: input.companyId,
      order: {
        contactId: input.contactId,
      },
    },
    orderBy: {
      order: {
        createdAt: "desc",
      },
    },
    select: {
      productId: true,
      quantity: true,
      unitPrice: true,
      order: {
        select: {
          id: true,
          createdAt: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
  });

  return items.map((item) => ({
    productId: item.productId,
    productName: item.product.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toString(),
    orderId: item.order.id,
    purchasedAt: item.order.createdAt,
  }));
}
