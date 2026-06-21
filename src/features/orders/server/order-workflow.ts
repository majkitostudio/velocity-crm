import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import type { CurrentUser } from "@/src/server/auth/guards";
import { recordAuditEvent } from "@/src/server/audit";
import { notifyOrderPriceAdjustments } from "@/src/features/notifications/server/notifications.service";
import { getActiveProductPriceSnapshots } from "@/src/features/products/server/products.service";

import type { OrderCreatedResult, OrderItemDraft } from "../types";
import { createOrderInTransaction } from "./orders.service";

type TransactionClient = Prisma.TransactionClient;

export async function createOrderForCallInTransaction(
  tx: TransactionClient,
  input: {
    currentUser: CurrentUser;
    contactId: string;
    note?: string | null;
    items: OrderItemDraft[];
  },
): Promise<OrderCreatedResult> {
  const productSnapshots = await getActiveProductPriceSnapshots({
    currentUser: input.currentUser,
    productIds: input.items.map((item) => item.productId),
    client: tx,
  });

  const result = await createOrderInTransaction(tx, {
    ...input,
    productSnapshots,
  });
  const adjustedItems = result.items.filter((item) => item.priceChanged);

  await recordAuditEvent({
    tx,
    companyId: input.currentUser.companyId,
    actorUserId: input.currentUser.id,
    action: AuditActions.ORDER_CREATED,
    entityType: AuditEntityTypes.ORDER,
    entityId: result.orderId,
    contactId: input.contactId,
    metadata: {
      source: "call_workflow",
      contactId: input.contactId,
      itemCount: result.itemCount,
      total: result.total,
      hasPriceAdjustments: adjustedItems.length > 0,
      adjustedItems: adjustedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        catalogUnitPrice: item.catalogUnitPrice,
        unitPrice: item.unitPrice,
      })),
    },
  });

  if (adjustedItems.length > 0) {
    await notifyOrderPriceAdjustments({
      currentUser: input.currentUser,
      orderId: result.orderId,
      adjustedItems,
    });
  }

  return result;
}
