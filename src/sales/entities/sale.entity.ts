import {
  Cliente,
  ClienteDireccion,
  DetalleVenta,
  MetodoPago,
  Sucursal,
  TipoDocumento,
  Usuario,
  VentaEstado,
} from '../../agilizar/interface/SellResponse.interface';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SaleState } from '../interfaces/sale-state.interface';

@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  @Prop()
  Cliente: Cliente[];
  @Prop()
  DetalleVenta: DetalleVenta[];
  @Prop()
  MetodoPago: MetodoPago[];
  @Prop({
    type: Number,
    required: true,
    unique: true,
    index: true,
  })
  OBJECT_ID: number;
  @Prop()
  Sucursal: Sucursal[];
  @Prop()
  TipoDocumento: TipoDocumento[];
  @Prop()
  Usuario: Usuario[];
  @Prop({
    type: Number,
    isRequired: false,
  })
  ValorEnvio: null;
  @Prop()
  VentaEstado: VentaEstado[];
  @Prop()
  clienteDireccion: ClienteDireccion[] | null;
  @Prop()
  cliente_direccion_id: number | null;
  @Prop()
  cliente_id: number | null;
  @Prop({
    type: Number,
    required: false,
  })
  completado_internet: null;
  @Prop()
  esta_activo: boolean;
  @Prop()
  fecha_entrega: string;
  @Prop()
  fecha_ingreso: string;
  @Prop({
    type: Number,
    required: false,
  })
  hoja_ruta_id: null;
  @Prop()
  iva: number;
  @Prop()
  motivo_rechazo: string;
  @Prop()
  neto: number;
  @Prop()
  numero_documento: string;
  @Prop()
  observacion: string;
  @Prop()
  pagado: boolean;
  @Prop()
  peso: number;
  @Prop()
  sector_id: number | null;
  @Prop()
  sucursal_id: number;
  @Prop({
    type: Number,
    required: false,
  })
  super_factura_id: null;
  @Prop()
  tipo_documento_id: number;
  @Prop({
    type: Number,
    required: false,
  })
  tipo_embalaje_id: null;
  @Prop()
  total: number;
  @Prop()
  usuario_id: number;
  @Prop()
  venta_cabecera_id: number;
  @Prop()
  venta_estado_id: number;
  @Prop()
  venta_internet_id: string;
  @Prop({
    default: SaleState.PENDIENTE,
    enum: SaleState,
  })
  state: SaleState;
  @Prop({
    default: null,
    required: false,
  })
  defontana_id: number | null;
  @Prop({
    default: null,
    required: false,
  })
  error: string | null;
}
export type SaleDocument = HydratedDocument<Sale>;
export const SaleSchema = SchemaFactory.createForClass(Sale);
