export type OrderItemDraft = {
  productId: string;
  quantity: number;
  unitPrice: string;
};

export type OrderLineSummary = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  catalogUnitPrice: string;
  lineTotal: string;
  priceChanged: boolean;
};

export type OrderCreatedResult = {
  orderId: string;
  itemCount: number;
  total: string;
  items: OrderLineSummary[];
};
