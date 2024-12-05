export interface ProductInterface {
  catalog: string;
  barcode: string;
  status: boolean;
  ivaSpecific: number;
  ivaUnitary: number;
  brandId: number;
  name: string;
  nameAttribute: string;
  weight: number;
  productFamilyId: number;
  uuid: number;
  productSubFamilyId: number;
  sku: string;
  skuOld: string;
  type: string;
  unity: number;
  visibility: boolean;
  wcProductId?: string | null;
  price?: number;
}
