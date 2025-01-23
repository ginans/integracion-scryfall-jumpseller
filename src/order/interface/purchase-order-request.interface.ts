export interface IPurchaseOrderRequest {
  providerID: string;
  providerData?: IProviderData;
  serie: string;
  number: number;
  businessCenter: string;
  coinID: string;
  paymentCondition: string;
  documentTypeId: string;
  exchangeRate: number;
  receiptDate: string;
  expirationDate: string;
  emissionDate: string;
  amountBeforeTaxes: number;
  modifiers: number;
  amountExempt: number;
  amountTotal: number;
  taxes: number;
  details: IDetail[];
  dispatchContact: string;
  dispatchAddress: string;
  dispatchDistrict: string;
  dispatchState: string;
  dispatchCity: string;
  dispatchCountry: string;
  dispatchPhone: string;
  comment: string;
}

export interface IProviderData {
  legalCode?: string;
  name?: string;
  address?: string;
  district?: string;
  email?: string;
  business?: string;
  rubroId?: string;
  giro?: string;
  city?: string;
}

export interface IDetail {
  isService: boolean;
  productID: string;
  quantity: number;
  total: number;
  discount: number;
  discountType: number;
  price: number;
  comment: string;
  productData: IProductData;
}

export interface IProductData {
  code: string;
  name: string;
  unit: string;
  price: number;
  description: string;
  isService: boolean;
}
