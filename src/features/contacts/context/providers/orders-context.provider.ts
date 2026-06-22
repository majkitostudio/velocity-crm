import {
  countOrdersForContact,
  listRecentOrdersForContact,
} from "@/src/features/orders/server/orders.repository";

import { formatContextDecimal } from "../lib/format-context-value";
import type { ContactContextProvider } from "../types/contact-context-provider";

export const ORDERS_CONTEXT_PROVIDER_VERSION = 1;

function calculateOrderTotal(
  items: Awaited<ReturnType<typeof listRecentOrdersForContact>>[number]["items"],
): string {
  const total = items.reduce((sum, item) => {
    return sum + Number(item.unitPrice) * item.quantity;
  }, 0);

  return total.toFixed(2);
}

export const ordersContextProvider: ContactContextProvider<"orders"> = {
  key: "orders",
  version: ORDERS_CONTEXT_PROVIDER_VERSION,

  async provide(input, options) {
    const [orders, totalOrderCount] = await Promise.all([
      listRecentOrdersForContact({
        companyId: input.companyId,
        contactId: input.contactId,
        limit: options.limits.orders,
      }),
      countOrdersForContact({
        companyId: input.companyId,
        contactId: input.contactId,
      }),
    ]);

    return {
      orders: {
        recent: orders.map((order) => ({
          id: order.id,
          status: order.status,
          note: options.includeSensitiveData ? order.note : null,
          operatorName: order.operator.name,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: formatContextDecimal(item.unitPrice),
          })),
          total: calculateOrderTotal(order.items),
        })),
      },
      aggregates: {
        totalOrderCount,
        successfulOrderCount: totalOrderCount,
      },
    };
  },
};
