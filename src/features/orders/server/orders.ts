import "server-only";

import { OrderStatus, type Order } from "@/src/generated/prisma/client";
import { NotFoundError, ValidationError } from "@/src/domain/errors";
import { requireCurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

export type CreateOrderInput = {
  contactId: string;
  note?: string | null;
  items: {
    productId: string;
    quantity: number;
    unitPrice: string;
  }[];
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const currentUser = await requireCurrentUser();

  if (input.items.length === 0) {
    throw new ValidationError("Order must contain at least one item");
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      companyId: currentUser.companyId,
    },
    select: {
      id: true,
    },
  });

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  const products = await prisma.product.findMany({
    where: {
      companyId: currentUser.companyId,
      id: {
        in: input.items.map((item) => item.productId),
      },
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (products.length !== new Set(input.items.map((item) => item.productId)).size) {
    throw new NotFoundError("One or more products were not found");
  }

  return prisma.order.create({
    data: {
      companyId: currentUser.companyId,
      contactId: contact.id,
      operatorId: currentUser.id,
      status: OrderStatus.NEW,
      note: input.note ?? null,
      items: {
        create: input.items.map((item) => ({
          companyId: currentUser.companyId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
  });
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
}): Promise<Order> {
  const currentUser = await requireCurrentUser();

  return prisma.order.update({
    where: {
      id: input.orderId,
      companyId: currentUser.companyId,
    },
    data: {
      status: input.status,
    },
  });
}
