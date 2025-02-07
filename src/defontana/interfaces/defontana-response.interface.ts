export interface BaseDefontanaResponse {
  success: boolean;
  message: string;
  exceptionMessage: string;
}

export interface DefontanaResponse extends BaseDefontanaResponse {
  folio: number;
}
export interface PurchaseOrderResponse extends BaseDefontanaResponse {
  number: string;
}

export interface PdfResponse extends BaseDefontanaResponse {
  document: string;
}

