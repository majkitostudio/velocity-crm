import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { ValidationError } from "@/src/domain/errors";
import type { CurrentUser } from "@/src/server/auth/guards";
import type { ProductPriceSnapshot } from "@/src/features/products/types";

import type { OrderCreatedResult, OrderItemDraft, OrderLineSummary } from "../types";
import { createOrderForCompany, findOrderSummaryByIdForCompany } from "./orders.repository";

type TransactionClient = Prisma.TransactionClient;

function parsePriceToCents(value: string): bigint {
  const [wholePart, decimalPart = ""] = value.replace(",", ".").split(".");
  const centsPart = decimalPart.padEnd(2, "0").slice(0, 2);
  return BigInt(wholePart) * BigInt(100) + BigInt(centsPart);
}

function formatCents(cents: bigint): string {
  const whole = cents / BigInt(100);
  const fraction = cents % BigInt(100);
  return `${whole.toString()}.${fraction.toString().padStart(2, "0")}`;
}

function assertUniqueProductIds(items: OrderItemDraft[]): void {
  const productIds = new Set<string>();

  for (const item of items) {
    if (productIds.has(item.productId)) {
      throw new ValidationError("Stejný produkt může být v objednávce pouze jednou");
    }

    productIds.add(item.productId);
  }
}

function buildOrderSummary(input: {
  items: OrderItemDraft[];
  products: {
    productId: string;
    name: string;
    catalogUnitPrice: string;
  }[];
}): {
  lines: OrderLineSummary[];
  total: string;
} {
  const productsById = new Map(input.products.map((product) => [product.productId, product]));
  let totalCents = BigInt(0);

  const lines = input.items.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new ValidationError("Produkt nebyl nalezen v aktivním katalogu");
    }

    const unitPriceCents = parsePriceToCents(item.unitPrice);
    const catalogPriceCents = parsePriceToCents(product.catalogUnitPrice);
    const lineTotalCents = unitPriceCents * BigInt(item.quantity);
    totalCents += lineTotalCents;

    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: formatCents(unitPriceCents),
      catalogUnitPrice: formatCents(catalogPriceCents),
      lineTotal: formatCents(lineTotalCents),
      priceChanged: unitPriceCents !== catalogPriceCents,
    };
  });

  return {
    lines,
    total: formatCents(totalCents),
  };
}

export async function createOrderInTransaction(
  tx: TransactionClient,
  input: {
    currentUser: CurrentUser;
    contactId: string;
    note?: string | null;
    items: OrderItemDraft[];
    productSnapshots: ProductPriceSnapshot[];
  },
): Promise<OrderCreatedResult> {
  if (input.items.length === 0) {
    throw new ValidationError("Objednávka musí obsahovat alespoň jednu položku");
  }

  assertUniqueProductIds(input.items);

  const summary = buildOrderSummary({
    items: input.items,
    products: input.productSnapshots,
  });

  const order = await createOrderForCompany(tx, {
    companyId: input.currentUser.companyId,
    contactId: input.contactId,
    operatorId: input.currentUser.id,
    note: input.note ?? null,
    items: summary.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
  });

  return {
    orderId: order.id,
    itemCount: summary.lines.length,
    total: summary.total,
    items: summary.lines,
  };
}

export async function getOrderCreatedResultById(input: {
  companyId: string;
  orderId: string;
}): Promise<OrderCreatedResult | null> {
  const order = await findOrderSummaryByIdForCompany(input);

  if (!order) {
    return null;
  }

  let totalCents = BigInt(0);
  const items = order.items.map((item) => {
    const unitPriceCents = parsePriceToCents(item.unitPrice.toString());
    const lineTotalCents = unitPriceCents * BigInt(item.quantity);
    totalCents += lineTotalCents;

    return {
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: formatCents(unitPriceCents),
      catalogUnitPrice: formatCents(unitPriceCents),
      lineTotal: formatCents(lineTotalCents),
      priceChanged: false,
    };
  });

  return {
    orderId: order.id,
    itemCount: items.length,
    total: formatCents(totalCents),
    items,
  };
}

