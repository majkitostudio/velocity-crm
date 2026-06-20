import "server-only";

import { OrderStatus, type Order } from "@/src/generated/prisma/client";
import { ValidationError } from "@/src/domain/errors";

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
  void input;
  throw new ValidationError("Order creation is handled by OrderWorkflow in Slice 6");
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
}): Promise<Order> {
  void input;
  throw new ValidationError("Order status changes are not part of Slice 6");
}
