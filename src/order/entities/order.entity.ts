import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  IngresoDetalle,
  Proveedor,
  TipoDocumento,
} from '../interface/order-response.interface';

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  @Prop()
  IngresoDetalle: IngresoDetalle[];
  @Prop()
  Proveedor: Proveedor[];
  @Prop()
  TipoDocumento: TipoDocumento[];
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
    default: 'pending',
  })
  status: string;
  @Prop({
    required: false,
    nullable: true,
    default: null,
  })
  defontanaNumber: number;
  @Prop({
    required: false,
    nullable: true,
    default: null,
  })
  cif_id: number | null;
  @Prop({
    required: false,
    nullable: true,
    default: null,
  })
  admission_rights_id: number | null;
  @Prop({
    required: false,
    nullable: true,
    default: null,
  })
  customs_clearance_costs_id: number | null;
  @Prop({
    required: false,
    nullable: true,
    default: null,
  })
  insurance_warehouse_id: number | null;
}
export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
