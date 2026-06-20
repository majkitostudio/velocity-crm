export type ProductCategoryView = {
  id: string;
  name: string;
  isActive: boolean;
  productCount: number;
};

export type ProductCatalogItem = {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categoryIsActive: boolean | null;
};

export type ProductCatalogView = {
  canManage: boolean;
  categories: ProductCategoryView[];
  products: ProductCatalogItem[];
};

export type OrderProductCatalogItem = {
  id: string;
  name: string;
  price: string;
  categoryName: string | null;
};

export type ProductPriceSnapshot = {
  productId: string;
  name: string;
  catalogUnitPrice: string;
};
