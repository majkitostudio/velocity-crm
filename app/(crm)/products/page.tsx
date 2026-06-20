import type { Metadata } from "next";

import { ProductsCatalog } from "@/src/features/products/components/products-catalog";
import { getProductCatalogView } from "@/src/features/products/server/products.service";

export const metadata: Metadata = {
  title: "Produkty — Velocity CRM",
};

export default async function ProductsPage() {
  const view = await getProductCatalogView();

  return <ProductsCatalog view={view} />;
}
