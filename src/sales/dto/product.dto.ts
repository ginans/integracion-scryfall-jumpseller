export interface ProductDto {
  type: string;
  isExempt: boolean;
  code: string;
  count: number;
  productName: string;
  productNameBarCode: string;
  price: number;
  discount: {
    type: number;
    value: number;
  };
  especificTax: {
    value: number;
  };
  comment: string;
  unit: string;
  analysis: {
    accountNumber: string;
    businessCenter: string;
    classifier01: string;
    classifier02: string;
  };
  useBatch: boolean;
  batchInfo: {
    amount: number;
    batchNumber: string;
  }[];
}
