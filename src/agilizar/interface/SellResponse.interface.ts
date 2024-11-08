export interface SellResponse {
  get_reporteVentasResult: GetReporteVentasResult[];
}
export interface GetReporteVentasResult {
  Cliente: Cliente[] | null;
  DetalleVenta: DetalleVenta[];
  MetodoPago: MetodoPago[];
  OBJECT_ID: number;
  Sucursal: Sucursal[];
  TipoDocumento: TipoDocumento[];
  Usuario: Usuario[];
  ValorEnvio: null;
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
  tipo_embalaje_id: null;
  total: number;
  usuario_id: number;
  venta_cabecera_id: number;
  venta_estado_id: number;
  venta_internet_id: string;
}
export interface Cliente {
  CondicionPago: CondicionPago[];
  apellido: string;
  cliente_id: number;
  condicion_pago_id: number;
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
  codigo_tipo_documento: string;
  es_indexable: boolean;
  es_requerido: boolean;
  esta_activo: boolean;
  nombre: string;
  tipo_documento_id: number;
  tipo_documento_padre_id: null;
  ultimo_folio: number;
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
  nombre: string;
  orden: number;
  venta_estado_id: number;
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
