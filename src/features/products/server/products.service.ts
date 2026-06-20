import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { ConflictError, NotFoundError } from "@/src/domain/errors";
import {
  canManageCompanyData,
  requireCurrentUser,
  requireRole,
  type CurrentUser,
} from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

import type {
  ProductCatalogItem,
  ProductCatalogView,
  ProductPriceSnapshot,
} from "../types";
import {
  createProductCategoryForCompany,
  createProductForCompany,
  findProductByIdForCompany,
  findProductCategoryByIdForCompany,
  findProductCategoryDuplicateForCompany,
  findProductDuplicateForCompany,
  listActiveProductsByIdsForCompany,
  listProductCategoriesForCompany,
  listProductsForCompany,
  setProductActiveForCompany,
  setProductCategoryActiveForCompany,
  updateProductCategoryForCompany,
  updateProductForCompany,
} from "./products.repository";

type TransactionClient = Prisma.TransactionClient;

function mapProduct(row: Awaited<ReturnType<typeof listProductsForCompany>>[number]): ProductCatalogItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price.toString(),
    isActive: row.isActive,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    categoryIsActive: row.category?.isActive ?? null,
  };
}

async function assertCategoryInCompany(input: {
  companyId: string;
  categoryId: string | null;
}): Promise<void> {
  if (!input.categoryId) {
    return;
  }

  const category = await findProductCategoryByIdForCompany({
    companyId: input.companyId,
    categoryId: input.categoryId,
  });

  if (!category) {
    throw new NotFoundError("Kategorie nebyla nalezena");
  }
}

async function assertUniqueCategoryName(input: {
  companyId: string;
  name: string;
  excludeCategoryId?: string;
}): Promise<void> {
  const duplicate = await findProductCategoryDuplicateForCompany(input);

  if (duplicate) {
    throw new ConflictError("Kategorie se stejným názvem už existuje");
  }
}

async function assertUniqueProductName(input: {
  companyId: string;
  name: string;
  excludeProductId?: string;
}): Promise<void> {
  const duplicate = await findProductDuplicateForCompany(input);

  if (duplicate) {
    throw new ConflictError("Produkt se stejným názvem už existuje");
  }
}

export async function getProductCatalogView(): Promise<ProductCatalogView> {
  const currentUser = await requireCurrentUser();
  const canManage = canManageCompanyData(currentUser.role);

  const [categories, products] = await Promise.all([
    listProductCategoriesForCompany({
      companyId: currentUser.companyId,
    }),
    listProductsForCompany({
      companyId: currentUser.companyId,
      includeInactive: canManage,
    }),
  ]);

  return {
    canManage,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      isActive: category.isActive,
      productCount: category._count.products,
    })),
    products: products.map(mapProduct),
  };
}

export async function createProductCategory(input: { name: string }) {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  await assertUniqueCategoryName({
    companyId: currentUser.companyId,
    name: input.name,
  });

  return createProductCategoryForCompany({
    companyId: currentUser.companyId,
    name: input.name,
  });
}

export async function updateProductCategory(input: {
  categoryId: string;
  name: string;
}) {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  const category = await findProductCategoryByIdForCompany({
    companyId: currentUser.companyId,
    categoryId: input.categoryId,
  });

  if (!category) {
    throw new NotFoundError("Kategorie nebyla nalezena");
  }

  await assertUniqueCategoryName({
    companyId: currentUser.companyId,
    name: input.name,
    excludeCategoryId: input.categoryId,
  });

  return updateProductCategoryForCompany({
    companyId: currentUser.companyId,
    categoryId: input.categoryId,
    name: input.name,
  });
}

export async function setProductCategoryActive(input: {
  categoryId: string;
  isActive: boolean;
}) {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  const category = await findProductCategoryByIdForCompany({
    companyId: currentUser.companyId,
    categoryId: input.categoryId,
  });

  if (!category) {
    throw new NotFoundError("Kategorie nebyla nalezena");
  }

  return setProductCategoryActiveForCompany({
    companyId: currentUser.companyId,
    categoryId: input.categoryId,
    isActive: input.isActive,
  });
}

export async function createProduct(input: {
  name: string;
  price: string;
  categoryId: string | null;
}) {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  await Promise.all([
    assertCategoryInCompany({
      companyId: currentUser.companyId,
      categoryId: input.categoryId,
    }),
    assertUniqueProductName({
      companyId: currentUser.companyId,
      name: input.name,
    }),
  ]);

  return createProductForCompany({
    companyId: currentUser.companyId,
    name: input.name,
    price: input.price,
    categoryId: input.categoryId,
  });
}

export async function updateProduct(input: {
  productId: string;
  name: string;
  price: string;
  categoryId: string | null;
}) {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  const product = await findProductByIdForCompany({
    companyId: currentUser.companyId,
    productId: input.productId,
  });

  if (!product) {
    throw new NotFoundError("Produkt nebyl nalezen");
  }

  await Promise.all([
    assertCategoryInCompany({
      companyId: currentUser.companyId,
      categoryId: input.categoryId,
    }),
    assertUniqueProductName({
      companyId: currentUser.companyId,
      name: input.name,
      excludeProductId: input.productId,
    }),
  ]);

  return updateProductForCompany({
    companyId: currentUser.companyId,
    productId: input.productId,
    name: input.name,
    price: input.price,
    categoryId: input.categoryId,
  });
}

export async function setProductActive(input: {
  productId: string;
  isActive: boolean;
}) {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  const product = await findProductByIdForCompany({
    companyId: currentUser.companyId,
    productId: input.productId,
  });

  if (!product) {
    throw new NotFoundError("Produkt nebyl nalezen");
  }

  return setProductActiveForCompany({
    companyId: currentUser.companyId,
    productId: input.productId,
    isActive: input.isActive,
  });
}

export async function getActiveProductPriceSnapshots(input: {
  currentUser: CurrentUser;
  productIds: string[];
  client?: typeof prisma | TransactionClient;
}): Promise<ProductPriceSnapshot[]> {
  const uniqueProductIds = [...new Set(input.productIds)];

  const products = await listActiveProductsByIdsForCompany(input.client ?? prisma, {
    companyId: input.currentUser.companyId,
    productIds: uniqueProductIds,
  });

  if (products.length !== uniqueProductIds.length) {
    throw new NotFoundError("Jeden nebo více produktů nebylo nalezeno");
  }

  const productsById = new Map(
    products.map((product) => [
      product.id,
      {
        productId: product.id,
        name: product.name,
        unitPrice: product.price.toString(),
      },
    ]),
  );

  return input.productIds.map((productId) => productsById.get(productId)!);
}
