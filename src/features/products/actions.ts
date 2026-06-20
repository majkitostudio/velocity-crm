"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  zodFieldErrors,
} from "@/src/domain/action-result";
import { isDomainError } from "@/src/domain/errors";

import {
  createProduct,
  createProductCategory,
  setProductActive,
  setProductCategoryActive,
  updateProduct,
  updateProductCategory,
} from "./server/products.service";
import {
  createProductCategorySchema,
  createProductSchema,
  setProductActiveSchema,
  setProductCategoryActiveSchema,
  updateProductCategorySchema,
  updateProductSchema,
} from "./schemas";

type MutationResult = { id: string };

function categoryPayload(formData: FormData) {
  return {
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    isActive: formData.get("isActive"),
  };
}

function productPayload(formData: FormData) {
  return {
    productId: formData.get("productId"),
    name: formData.get("name"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    isActive: formData.get("isActive"),
  };
}

function handleActionError(error: unknown): ActionResult<MutationResult> {
  if (isDomainError(error)) {
    return actionFailure(error.message);
  }

  throw error;
}

export async function createProductCategoryAction(
  _prevState: ActionResult<MutationResult> | null,
  formData: FormData,
): Promise<ActionResult<MutationResult>> {
  const parsed = createProductCategorySchema.safeParse(categoryPayload(formData));

  if (!parsed.success) {
    return actionFailure("Zkontrolujte prosím zadané hodnoty.", zodFieldErrors(parsed.error));
  }

  try {
    const category = await createProductCategory(parsed.data);
    revalidatePath("/products");
    return actionSuccess({ id: category.id });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateProductCategoryAction(
  _prevState: ActionResult<MutationResult> | null,
  formData: FormData,
): Promise<ActionResult<MutationResult>> {
  const parsed = updateProductCategorySchema.safeParse(categoryPayload(formData));

  if (!parsed.success) {
    return actionFailure("Zkontrolujte prosím zadané hodnoty.", zodFieldErrors(parsed.error));
  }

  try {
    const category = await updateProductCategory(parsed.data);
    revalidatePath("/products");
    return actionSuccess({ id: category.id });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function setProductCategoryActiveAction(
  _prevState: ActionResult<MutationResult> | null,
  formData: FormData,
): Promise<ActionResult<MutationResult>> {
  const parsed = setProductCategoryActiveSchema.safeParse(categoryPayload(formData));

  if (!parsed.success) {
    return actionFailure("Zkontrolujte prosím zadané hodnoty.", zodFieldErrors(parsed.error));
  }

  try {
    const category = await setProductCategoryActive(parsed.data);
    revalidatePath("/products");
    return actionSuccess({ id: category.id });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createProductAction(
  _prevState: ActionResult<MutationResult> | null,
  formData: FormData,
): Promise<ActionResult<MutationResult>> {
  const parsed = createProductSchema.safeParse(productPayload(formData));

  if (!parsed.success) {
    return actionFailure("Zkontrolujte prosím zadané hodnoty.", zodFieldErrors(parsed.error));
  }

  try {
    const product = await createProduct(parsed.data);
    revalidatePath("/products");
    return actionSuccess({ id: product.id });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateProductAction(
  _prevState: ActionResult<MutationResult> | null,
  formData: FormData,
): Promise<ActionResult<MutationResult>> {
  const parsed = updateProductSchema.safeParse(productPayload(formData));

  if (!parsed.success) {
    return actionFailure("Zkontrolujte prosím zadané hodnoty.", zodFieldErrors(parsed.error));
  }

  try {
    const product = await updateProduct(parsed.data);
    revalidatePath("/products");
    return actionSuccess({ id: product.id });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function setProductActiveAction(
  _prevState: ActionResult<MutationResult> | null,
  formData: FormData,
): Promise<ActionResult<MutationResult>> {
  const parsed = setProductActiveSchema.safeParse(productPayload(formData));

  if (!parsed.success) {
    return actionFailure("Zkontrolujte prosím zadané hodnoty.", zodFieldErrors(parsed.error));
  }

  try {
    const product = await setProductActive(parsed.data);
    revalidatePath("/products");
    return actionSuccess({ id: product.id });
  } catch (error) {
    return handleActionError(error);
  }
}
