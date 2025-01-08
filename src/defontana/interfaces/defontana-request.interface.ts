export interface OrderRequestInterface {
  documentTypeId: string;
  number?: number;
  pricingId: string;
  clientFileId: string;
  sellerFileId: string;
  referenceNumber: string;
  paymentConditionId: string;
  billingCoinId: string;
  billingRate: number;
  shopId: string;
  priceListId: string;
  billingType: string;
  giro: string;
  district: string;
  orderDetails: OrderDetailInterface[];
  taxes: TaxInterface[];
  creationDate: DateInterface;
  expirationDate: DateInterface;
  glossGeneral: string;
  glossDispatch: string;
  glossBill: string;
  glossPresentation: string;
  orderRecDesGlobal: OrderRecDesGlobalInterface[];
}

export interface OrderDetailInterface {
  type: string;
  isExempt: boolean;
  isService: boolean;
  code: string;
  unit: string;
  count: number;
  price: number;
  deliveryTime: {
    hour: number;
    minute: number;
  };
  discount: {
    value: number;
    type: number;
  };
  tax: TaxInterface;
  comment: string;
  productName: string;
  deliveryDate: DateInterface;
}

export interface TaxInterface {
  code: string;
  value: number;
}

export interface DateInterface {
  day: number;
  month: number;
  year: number;
}

export interface OrderRecDesGlobalInterface {
  amount: number;
  modifierClass: string;
  name: string;
  percentage: number;
  value: number;
}
