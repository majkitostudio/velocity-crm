import "server-only";

import type { Product, ProductCategory, Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type TransactionClient = Prisma.TransactionClient;

const categorySelect = {
  id: true,
  name: true,
  isActive: true,
  _count: {
    select: {
      products: true,
    },
  },
} as const;

const productSelect = {
  id: true,
  name: true,
  price: true,
  isActive: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
} as const;

export async function listProductCategoriesForCompany(input: { companyId: string }) {
  return prisma.productCategory.findMany({
    where: {
      companyId: input.companyId,
    },
    select: categorySelect,
    orderBy: {
      name: "asc",
    },
  });
}

export async function listProductsForCompany(input: {
  companyId: string;
  includeInactive: boolean;
}) {
  return prisma.product.findMany({
    where: {
      companyId: input.companyId,
      ...(input.includeInactive ? {} : { isActive: true }),
    },
    select: productSelect,
    orderBy: {
      name: "asc",
    },
  });
}

export async function findProductCategoryByIdForCompany(input: {
  companyId: string;
  categoryId: string;
}): Promise<ProductCategory | null> {
  return prisma.productCategory.findFirst({
    where: {
      id: input.categoryId,
      companyId: input.companyId,
    },
  });
}

export async function findProductByIdForCompany(input: {
  companyId: string;
  productId: string;
}): Promise<Product | null> {
  return prisma.product.findFirst({
    where: {
      id: input.productId,
      companyId: input.companyId,
    },
  });
}

export async function findProductCategoryDuplicateForCompany(input: {
  companyId: string;
  name: string;
  excludeCategoryId?: string;
}): Promise<{ id: string } | null> {
  return prisma.productCategory.findFirst({
    where: {
      companyId: input.companyId,
      name: input.name,
      ...(input.excludeCategoryId
        ? {
            id: {
              not: input.excludeCategoryId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });
}

export async function findProductDuplicateForCompany(input: {
  companyId: string;
  name: string;
  excludeProductId?: string;
}): Promise<{ id: string } | null> {
  return prisma.product.findFirst({
    where: {
      companyId: input.companyId,
      name: input.name,
      ...(input.excludeProductId
        ? {
            id: {
              not: input.excludeProductId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });
}

export async function createProductCategoryForCompany(input: {
  companyId: string;
  name: string;
}): Promise<ProductCategory> {
  return prisma.productCategory.create({
    data: {
      companyId: input.companyId,
      name: input.name,
    },
  });
}

export async function updateProductCategoryForCompany(input: {
  companyId: string;
  categoryId: string;
  name: string;
}): Promise<ProductCategory> {
  return prisma.productCategory.update({
    where: {
      id: input.categoryId,
      companyId: input.companyId,
    },
    data: {
      name: input.name,
    },
  });
}

export async function setProductCategoryActiveForCompany(input: {
  companyId: string;
  categoryId: string;
  isActive: boolean;
}): Promise<ProductCategory> {
  return prisma.productCategory.update({
    where: {
      id: input.categoryId,
      companyId: input.companyId,
    },
    data: {
      isActive: input.isActive,
    },
  });
}

export async function createProductForCompany(input: {
  companyId: string;
  name: string;
  price: string;
  categoryId: string | null;
}): Promise<Product> {
  return prisma.product.create({
    data: {
      companyId: input.companyId,
      name: input.name,
      price: input.price,
      categoryId: input.categoryId,
    },
  });
}

export async function updateProductForCompany(input: {
  companyId: string;
  productId: string;
  name: string;
  price: string;
  categoryId: string | null;
}): Promise<Product> {
  return prisma.product.update({
    where: {
      id: input.productId,
      companyId: input.companyId,
    },
    data: {
      name: input.name,
      price: input.price,
      categoryId: input.categoryId,
    },
  });
}

export async function setProductActiveForCompany(input: {
  companyId: string;
  productId: string;
  isActive: boolean;
}): Promise<Product> {
  return prisma.product.update({
    where: {
      id: input.productId,
      companyId: input.companyId,
    },
    data: {
      isActive: input.isActive,
    },
  });
}

export async function listActiveProductsByIdsForCompany(
  client: typeof prisma | TransactionClient,
  input: {
    companyId: string;
    productIds: string[];
  },
) {
  return client.product.findMany({
    where: {
      companyId: input.companyId,
      id: {
        in: input.productIds,
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
    },
  });
}
