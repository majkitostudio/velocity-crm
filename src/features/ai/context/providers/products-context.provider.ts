import { listProductsForCompany } from "@/src/features/products/server/products.repository";
import { listPurchasedOrderItemsForContact } from "@/src/features/orders/server/orders.repository";

import {
  formatAiContextDate,
  formatAiContextDecimal,
} from "../lib/format-ai-context-value";
import type { ContactContextProvider } from "../types/contact-context-provider";
import type {
  ContactAiLastPurchasedProduct,
  ContactAiPurchasedProduct,
} from "../types/contact-ai-context";

export const PRODUCTS_CONTEXT_PROVIDER_VERSION = 1;

function buildPurchasedProducts(
  items: Awaited<ReturnType<typeof listPurchasedOrderItemsForContact>>,
): ContactAiPurchasedProduct[] {
  const byProduct = new Map<string, ContactAiPurchasedProduct>();

  for (const item of items) {
    const existing = byProduct.get(item.productId);

    if (!existing) {
      byProduct.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        totalQuantity: item.quantity,
        lastPurchasedAt: formatAiContextDate(item.purchasedAt),
      });
      continue;
    }

    byProduct.set(item.productId, {
      ...existing,
      totalQuantity: existing.totalQuantity + item.quantity,
      lastPurchasedAt:
        item.purchasedAt > new Date(existing.lastPurchasedAt)
          ? formatAiContextDate(item.purchasedAt)
          : existing.lastPurchasedAt,
    });
  }

  return [...byProduct.values()].sort((left, right) =>
    left.productName.localeCompare(right.productName, "cs"),
  );
}

function buildLastPurchased(
  items: Awaited<ReturnType<typeof listPurchasedOrderItemsForContact>>,
): ContactAiLastPurchasedProduct | null {
  const latest = items[0];

  if (!latest) {
    return null;
  }

  return {
    productId: latest.productId,
    productName: latest.productName,
    quantity: latest.quantity,
    unitPrice: latest.unitPrice,
    purchasedAt: formatAiContextDate(latest.purchasedAt),
    orderId: latest.orderId,
  };
}

export const productsContextProvider: ContactContextProvider<"products"> = {
  key: "products",
  version: PRODUCTS_CONTEXT_PROVIDER_VERSION,

  async provide(input) {
    const [catalog, purchasedItems] = await Promise.all([
      listProductsForCompany({
        companyId: input.companyId,
        includeInactive: false,
      }),
      listPurchasedOrderItemsForContact({
        companyId: input.companyId,
        contactId: input.contactId,
      }),
    ]);

    return {
      products: {
        catalog: catalog.map((product) => ({
          id: product.id,
          name: product.name,
          price: formatAiContextDecimal(product.price),
          categoryName: product.category?.name ?? null,
        })),
        purchased: buildPurchasedProducts(purchasedItems),
        lastPurchased: buildLastPurchased(purchasedItems),
      },
    };
  },
};
