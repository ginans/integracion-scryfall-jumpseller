import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  IngresoDetalle,
  IProveedor,
  ITipoDocumento,
} from '../interface/order-response.interface';
export interface ImportCosts {
  id: string;
  provider_id: number;
  amount: number;
  document_url: string;
  folio: number;
  pdf_url: string;
}
export enum OrderState {
  PENDIENTE = 'Pendiente',
  PROCESANDO = 'Procesando',
  PROVEEDOR_CREADO = 'Proveedor Creado',
  ORDEN_CREADA = 'Orden Creada',
  FACTURA_CREADA = 'Factura Creada',
  FALLIDO = 'Fallido',
}
@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  @Prop()
  IngresoDetalle: IngresoDetalle[];
  @Prop()
  Proveedor: IProveedor[];
  @Prop()
  TipoDocumento: ITipoDocumento[];
  @Prop({
    type: Boolean,
  })
  esta_activo: boolean;
  @Prop()
  fecha_creacion: string;
  @Prop()
  fecha_documento: string;
  @Prop()
  fecha_vencimiento: string;
  @Prop()
  ingreso_bodega_cabecera_id: number;
  @Prop()
  numero_documento: number;
  @Prop()
  proveedor_id: number;
  @Prop()
  tipo_documento_id: number;
  @Prop({
    default: true,
  })
  isNational: boolean;
  @Prop({
    default: OrderState.PENDIENTE,
  })
  status: OrderState;
  @Prop({
    required: false,
    nullable: true,
    default: null,
  })
  defontanaNumber: number | null;
  @Prop({
    required: false,
    nullable: true,
    default: null,
  })
  error: string | null;
  @Prop({
    required: false,
    nullable: true,
    default: null,
  })
  import_costs: ImportCosts[];
}
export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
