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

export interface PurchaseInterface {
  documentTypeId: string;
  documentEmissionDate: string;
  documentDueDate: string;
  accountingDate: string;
  providerId: string;
  referencedDocument: number;
  documentNumber: number;
  documentPlatformId: string;
  paymentConditionId: string;
  address: string;
  shopId: string;
  providerTypeId: string;
  providerAccountBusinessCenterId: string;
  providerAccountClassifier01: string;
  providerAccountClassifier02: string;
  amountBeforeTaxes: number;
  amountExempt: number;
  amountTotal: number;
  purchaseDetails: PurchaseDetailInterface[];
  taxes: TaxPurchaseInterface[];
  modifier: number;
  nonRecoverableTaxCode: string;
  comment: string;
  customFields: any[];
}

export interface PurchaseDetailInterface {
  accountId: string;
  expenseAmount: number;
  isService: boolean;
  comment: string;
  itemId: string;
  quantity: number;
  detailAnalysis: AnalysisInterface;
}

export interface TaxPurchaseInterface {
  code: string;
  value: number;
  percentaje: number;
  isIncrease: boolean;
  taxesAnalysis: AnalysisInterface;
}

export interface AnalysisInterface {
  fileId: string;
  classifier01: string;
  classifier02: string;
  businessCenterId: string;
}

export interface SaleRequestInterface {
  documentType: string;
  firstFolio: number;
  lastFolio: number;
  externalDocumentID: string;
  emissionDate: DateInterface;
  firstFeePaid: DateInterface;
  clientFile: string;
  contactIndex: string;
  rutMandante: string;
  paymentCondition: string;
  sellerFileId: string;
  clientAnalysis: ClientAnalysisInterface;
  billingCoin: string;
  billingRate: number;
  shopId: string;
  priceList: string;
  giro: string;
  district: string;
  city: string;
  contact: number;
  attachedDocuments: AttachedDocumentInterface[];
  storage: StorageInterface;
  details: DetailInterface[];
  saleTaxes: SaleTaxInterface[];
  ventaRecDesGlobal: VentaRecDesGlobalInterface[];
  gloss: string;
  customFields: CustomFieldInterface[];
  isTransferDocument: boolean;
}

export interface DateInterface {
  day: number;
  month: number;
  year: number;
}

export interface ClientAnalysisInterface {
  accountNumber: string;
  businessCenter: string;
  classifier01: string;
  classifier02: string;
}

export interface AttachedDocumentInterface {
  date: DateInterface;
  documentTypeId: string;
  folio: string;
  reason: string;
}

export interface StorageInterface {
  code: string;
  motive: string;
  storageAnalysis: StorageAnalysisInterface;
}

export interface StorageAnalysisInterface {
  accountNumber: string;
  businessCenter: string;
  classifier01: string;
  classifier02: string;
}

export interface DetailInterface {
  type: string;
  isExempt: boolean;
  code: string;
  count: number;
  productName: string;
  productNameBarCode: string;
  comment: string;
  price: number;
  discount: DiscountInterface;
  especificTax: EspecificTaxInterface;
  unit: string;
  analysis: IAnalysisInterface;
  useBatch: boolean;
  batchInfo: BatchInfoInterface[];
}

export interface DiscountInterface {
  type: number;
  value: number;
}

export interface EspecificTaxInterface {
  value: number;
}

export interface IAnalysisInterface {
  accountNumber: string;
  businessCenter: string;
  classifier01: string;
  classifier02: string;
}

export interface BatchInfoInterface {
  amount: number;
  batchNumber: string;
}

export interface SaleTaxInterface {
  code: string;
  value: number;
  taxeAnalysis: TaxeAnalysisInterface;
}

export interface TaxeAnalysisInterface {
  accountNumber: string;
  businessCenter: string;
  classifier01: string;
  classifier02: string;
}

export interface VentaRecDesGlobalInterface {
  amount: number;
  modifierClass: string;
  name: string;
  percentage: number;
  value: number;
}

export interface CustomFieldInterface {
  name: string;
  value: string;
}

export interface WoodManagementInfoInterface {
  maderaComunaRolOrigen: number;
  maderaManzanaRolOrigen: number;
  maderaPredioRolOrigen: number;
  maderaCodigoPlanCONAF: string;
  maderaLatitudOrigen: string;
  maderaLongitudOrigen: string;
  maderaSistemaReferencia: number;
}