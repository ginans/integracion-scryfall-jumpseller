export interface OrderResponse {
  readonly get_reporteComprasResult: GetReporteComprasResult[];
}

export interface GetReporteComprasResult {
  readonly IngresoDetalle: IngresoDetalle[];
  readonly Proveedor: IProveedor[];
  readonly TipoDocumento: ITipoDocumento[];
  readonly esta_activo: boolean;
  readonly fecha_creacion: string;
  readonly fecha_documento: string;
  readonly fecha_vencimiento: string;
  readonly ingreso_bodega_cabecera_id: number;
  readonly numero_documento: number;
  readonly numero_guia: number;
  readonly proveedor_id: number;
  readonly tipo_documento_id: number;
}

export interface IngresoDetalle {
  readonly Producto: IProducto[];
  readonly bodega_id: number;
  readonly cantidad: number;
  readonly esta_activo: boolean;
  readonly fecha_creacion: string;
  readonly fecha_vencimiento: string;
  readonly ingreso_bodega_cabecera_id: number;
  readonly ingreso_bodega_detalle_id: number;
  readonly lote: string;
  readonly marca_id: number;
  readonly precio_compra: number;
  readonly producto_id: number;
  readonly stock: number;
}

export interface IProducto {
  readonly catalogo: string;
  readonly codigo_barra: string;
  readonly esta_activo: boolean;
  readonly fecha_creacion: string;
  readonly marca_id: number;
  readonly nombre: string;
  readonly nombre_atributo: string;
  readonly peso: number;
  readonly producto_familia_id: number;
  readonly producto_id: number;
  readonly producto_subfamilia_id: number;
  readonly sku: string;
  readonly sku_old: string;
  readonly tipo: string;
  readonly unidad_medida_id: number;
  readonly visible: boolean;
  readonly wc_producto_id: null;
}

export interface IProveedor {
  readonly comuna_id: number;
  readonly condicion_pago_id: number;
  readonly direccion: string;
  readonly email: string;
  readonly esta_activo: boolean;
  readonly fecha_creacion: string;
  readonly giro_id: number;
  readonly internacional: boolean;
  readonly proveedor_id: number;
  readonly razon_social: string;
  readonly rut: string;
  readonly telefono: string;
}

export interface ITipoDocumento {
  readonly area_documental_id: number;
  readonly codigo_tipo_documento: string;
  readonly es_indexable: boolean;
  readonly es_requerido: boolean;
  readonly esta_activo: boolean;
  readonly nombre: string;
  readonly tipo_documento_id: number;
  readonly tipo_documento_padre_id: null;
  readonly ultimo_folio: number;
}
