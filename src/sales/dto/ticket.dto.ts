export class TicketDto {
  Encabezado: Encabezado;
  Detalles: IDetalle[];
  condicionpago: CondicionPago;
}
interface Encabezado {
  IdDoc: IdDoc;
  Emisor: Emisor;
  Receptor: IReceptor;
  Totales: Totales;
}
interface IdDoc {
  TipoDTE: number;
  TpoImpresion: string;
  IndTraslado: number;
}
interface Emisor {
  RUTEmisor: string;
}
export interface IReceptor {
  RUTRecep: string | null;
  RznSocRecep: string | null;
  GiroRecep: string | null;
  DirRecep: string | null;
  CmnaRecep: string | null;
  CiudadRecep: string | null;
}
interface Totales {
  IVA: number;
  TasaIVA: number;
  ImptoReten: any[];
  MntTotal: number;
}
export interface IDetalle {
  NmbItem: string;
  DscItem: string;
  QtyItem: number;
  UnmdItem: string;
  PrcItem: number;
  MontoItem: number;
  SKU: string;
  barCode: string;
}
interface CondicionPago {
  CondicionPago: string;
  Vendedor: string;
  IdVenta: number;
  numdoc: number;
}
