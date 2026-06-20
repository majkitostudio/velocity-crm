import "server-only";

import type { CurrentUser } from "@/src/server/auth/guards";
import type { OrderLineSummary } from "@/src/features/orders/types";

export async function notifyOrderPriceAdjustments(input: {
  currentUser: CurrentUser;
  orderId: string;
  adjustedItems: OrderLineSummary[];
}): Promise<void> {
  if (process.env.NODE_ENV === "development" && input.adjustedItems.length > 0) {
    console.debug("[notification:order-price-adjustment]", {
      companyId: input.currentUser.companyId,
      actorUserId: input.currentUser.id,
      orderId: input.orderId,
      adjustedItems: input.adjustedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        catalogUnitPrice: item.catalogUnitPrice,
        unitPrice: item.unitPrice,
      })),
    });
  }
}
