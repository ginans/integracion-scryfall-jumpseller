export interface SellResponse {
  get_reporteVentasResult: GetReporteVentasResult[];
}

export interface GetReporteVentasResult {
  Cliente: Cliente[] | null;
  DetalleVenta: DetalleVenta[];
  GuiaDespacho: GuiaDespacho[];
  MetodoPago: MetodoPago[];
  OBJECT_ID: number;
  Sucursal: Sucursal[];
  TipoDocumento: TipoDocumento[];
  Usuario: Usuario[];
  ValorEnvio: number | null;
  VentaEstado: VentaEstado[];
  clienteDireccion: ClienteDireccion[] | null;
  cliente_direccion_id: number | null;
  cliente_id: number | null;
  completado_internet: null;
  esta_activo: boolean;
  fecha_entrega: string;
  fecha_ingreso: string;
  hoja_ruta_id: null;
  iva: number;
  motivo_rechazo: string;
  neto: number;
  numero_documento: string;
  observacion: string;
  pagado: boolean;
  peso: number;
  sector_id: number | null;
  sucursal_id: number;
  super_factura_id: null;
  tipo_documento_id: number;
  tipo_embalaje_id: number | null;
  total: number;
  usuario_id: number;
  venta_cabecera_id: number;
  venta_estado_id: number;
  venta_internet_id: string;
}

export interface Cliente {
  CondicionPago: CondicionPago[] | null;
  GirosComerciales: GirosComerciale[] | null;
  apellido: string;
  cliente_id: number;
  condicion_pago_id: number | null;
  contacto: string;
  direccion_web: string;
  email: string;
  esta_activo: boolean;
  fecha_ingreso: string;
  fono_casa: string;
  fono_celular: string;
  giro_id: number | null;
  nombre: string;
  observaciones: string;
  rut: string;
  tipo_cliente_id: number;
}

export interface CondicionPago {
  condicion_pago_id: number;
  dias_vencimiento: number;
  esta_activo: boolean;
  nombre: CondicionPagoNombre;
}

export enum CondicionPagoNombre {
  Contado = 'CONTADO',
  Crédito30Días = 'CRÉDITO 30 DÍAS',
}

export interface GirosComerciale {
  esta_activo: boolean;
  giro_id: number;
  nombre: string;
}

export interface DetalleVenta {
  Producto: Producto[];
  cantidad: number;
  descripcion: string;
  precio_total: number;
  precio_unitario: number;
  producto_id: number;
  total_unidades: number;
  unidad_presentacion_id: number;
  venta_cabecera_id: number;
  venta_detalle_id: number;
}

export interface Producto {
  catalogo: string;
  codigo_barra: string;
  esta_activo: boolean;
  fecha_creacion: string;
  iva_especifico: number;
  iva_total: number;
  iva_unitario: number;
  marca_id: number;
  nombre: string;
  nombre_atributo: string;
  peso: number;
  producto_familia_id: number;
  producto_id: number;
  producto_subfamilia_id: number;
  sku: string;
  sku_old: string;
  tipo: string;
  unidad_medida_id: number;
  visible: boolean;
  wc_producto_id: null;
}

export interface GuiaDespacho {
  CAMPO_00: string;
  CAMPO_01: string;
  CAMPO_02: string;
  CAMPO_03: string;
  CAMPO_04: string;
  CAMPO_05: string;
  CAMPO_06: string;
  CAMPO_07: string;
  CAMPO_08: string;
  CAMPO_09: string;
  CAMPO_10: string;
  CAMPO_11: string;
  CAMPO_12: string;
  CAMPO_13: string;
  CAMPO_20: string;
  CAMPO_27: Campo27;
  CAMPO_28: string;
  CAMPO_29: string;
  CAMPO_30: string;
  CAMPO_31: string;
  CAMPO_32: string;
  CAMPO_33: string;
  CAMPO_51: string;
  CAMPO_52: string;
  CAMPO_53: string;
  CAMPO_54: string;
  CAMPO_55: string;
  ENVIO: string;
  ESTADO_DOCUMENTO_ID: number;
  ESTA_FACTURADO: boolean;
  FECHA_ENTREGA: FechaEntrega;
  FECHA_FACT: FechaFact;
  FECHA_TIME_STAMP: string;
  Factura: Factura[];
  LAT: string;
  LONG: string;
  MOTIVO_RECHAZO: string;
  OBJECT_CLASS: string;
  OBJECT_ID: number;
  OBSERVACION: string;
  OBSERVACIONDIRECCION: string;
  ORDEN: null;
  ORIGEN: Origen;
  PAGINAS: number;
  PESO: number;
  SuperFactura: SuperFactura[];
  TIPO_DOCUMENTO_ID: number;
  TIPO_FLUJO: string;
  UBICACION: string;
  USUARIO_ID: number;
  VERSION: number;
}

export enum Campo27 {
  No = 'NO',
  Si = 'SI',
}

export enum FechaEntrega {
  Date17252496000000400 = '/Date(1725249600000-0400)/',
  Date17253360000000400 = '/Date(1725336000000-0400)/',
}

export enum FechaFact {
  Date621355860000000300 = '/Date(-62135586000000-0300)/',
}

export interface Factura {
  CAMPO_00: string;
  CAMPO_01: string;
  CAMPO_02: string;
  CAMPO_03: string;
  CAMPO_04: string;
  CAMPO_05: string;
  CAMPO_06: string;
  CAMPO_07: string;
  CAMPO_08: string;
  CAMPO_09: string;
  CAMPO_10: string;
  CAMPO_11: string;
  CAMPO_12: string;
  CAMPO_13: string;
  CAMPO_20: string;
  CAMPO_27: string;
  CAMPO_28: string;
  CAMPO_29: string;
  CAMPO_30: string;
  CAMPO_31: string;
  CAMPO_32: string;
  CAMPO_33: string;
  CAMPO_51: string;
  CAMPO_52: string;
  CAMPO_53: string;
  CAMPO_54: string;
  CAMPO_55: string;
  ENVIO: string;
  ESTADO_DOCUMENTO_ID: number;
  ESTA_FACTURADO: boolean;
  FECHA_ENTREGA: null;
  FECHA_FACT: FechaFact;
  FECHA_TIME_STAMP: string;
  LAT: string;
  LONG: string;
  MOTIVO_RECHAZO: string;
  OBJECT_CLASS: string;
  OBJECT_ID: number;
  OBSERVACION: string;
  OBSERVACIONDIRECCION: string;
  ORDEN: null;
  ORIGEN: Origen;
  PAGINAS: number;
  PESO: number;
  SuperFactura: SuperFactura[];
  TIPO_DOCUMENTO_ID: number;
  TIPO_FLUJO: string;
  UBICACION: string;
  USUARIO_ID: number;
  VERSION: number;
}

export enum Origen {
  Superfactura = 'SUPERFACTURA',
}

export interface SuperFactura {
  OBJECT_ID: number;
  empresa_id: number;
  esta_activo: boolean;
  folio: number;
  json: string;
  respuesta: boolean;
  respuesta_json: string;
  super_factura_id: number;
  tipo_documento_id: number;
  traspaso_cabecera_id: null;
  venta_cabecera_id: number | null;
}

export interface MetodoPago {
  codigo: string;
  esta_activo: boolean;
  nombre: string;
  tipo_pago_id: number;
}

export interface Sucursal {
  descripcion: string;
  empresa_id: number;
  esta_activo: boolean;
  nombre: string;
  sucursal_id: number;
  telefono: string;
}

export interface TipoDocumento {
  area_documental_id: number;
  codigo_tipo_documento: CodigoTipoDocumento;
  es_indexable: boolean;
  es_requerido: boolean;
  esta_activo: boolean;
  nombre: TipoDocumentoNombre;
  tipo_documento_id: number;
  tipo_documento_padre_id: null;
  ultimo_folio: number;
}

export enum CodigoTipoDocumento {
  Tras = 'TRAS',
  Val = 'VAL',
}

export enum TipoDocumentoNombre {
  TraspasoDeProductosEntreBodegas = 'TRASPASO DE PRODUCTOS ENTRE BODEGAS',
  Voucher = 'VOUCHER',
}

export interface Usuario {
  apellido_materno: string;
  apellido_paterno: string;
  email: string;
  esta_activo: boolean;
  nombre: string;
  rut_dv: string;
  sucursal_id: number;
  usuario_id: number;
}

export interface VentaEstado {
  esta_activo: boolean;
  nombre: VentaEstadoNombre;
  orden: number;
  venta_estado_id: number;
}

export enum VentaEstadoNombre {
  Anulada = 'ANULADA',
  EnRuta = 'EN RUTA',
  Generada = 'GENERADA',
  Traspasada = 'TRASPASADA',
}

export interface ClienteDireccion {
  Lat: string;
  Lat2: string;
  Long: string;
  Long2: string;
  cliente_direccion_id: number;
  cliente_id: number;
  comuna_id: number;
  direccion: string;
  numeroCalle: string;
  observacionDireccion: string;
  sector_id: number;
}
