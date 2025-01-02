export enum SaleState {
  PENDIENTE = 'Pendiente',
  PROCESANDO = 'Procesando',
  CREADO = 'Creado',
  PAGADO = 'Pagado',
  FALLIDO = 'Fallido',
}
export interface IDetails {
  name: string;
  discount: string;
  price: number;
  quantity: number;
  unit: string;
  sku: string;
  barcode: string;
}
