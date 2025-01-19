import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IDetails, SaleState } from '../interfaces/sale-state.interface';

@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  @Prop()
  document_type: number;
  @Prop()
  emisor_rut: string;
  @Prop()
  client_rut: string;
  @Prop()
  client_rznSoc: string;
  @Prop()
  client_giro: string;
  @Prop()
  client_direction: string;
  @Prop()
  client_comune: string;
  @Prop()
  client_city: string;
  @Prop()
  total: number;
  @Prop()
  iva: number;
  @Prop()
  details: IDetails[];
  @Prop()
  payment_method: string; //TODO: change to enum and add all payment methods
  @Prop()
  seller: string;
  @Prop({
    type: Number,
    required: true,
    unique: true,
    index: true,
  })
  order_id: number;
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
