export class TicketDto {
  Encabezado: Encabezado;
  Detalles: Detalle[];
  condicionpago: CondicionPago;
}
interface Encabezado {
  IdDoc: IdDoc;
  Emisor: Emisor;
  Receptor: Receptor;
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
interface Receptor {
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
interface Detalle {
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
