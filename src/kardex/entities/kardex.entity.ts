import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { EnumState } from '../../common/enums/state.enum';

export type KardexDocument = Kardex & Document;

@Schema()
export class Kardex extends Document {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ 
    default: null,
    required: true, 
    unique: true
  })
  idTransmission: number;

  @Prop({ 
    default: null,
    required: true 
  })
  initialErpReference: string;

  @Prop({ 
    default: null,
    required: true 
  })
  finalErpReference: string;

  @Prop({ 
    default: null,
    required: true 
  })
  facility: string;

  @Prop({ 
    default: null,
    required: true 
  })
  initialZone: string;

  @Prop({ 
    default: null,
    required: true 
  })
  finalZone: string;

  @Prop({ 
    default: null,
    required: true 
  })
  sku: string;

  @Prop({ 
    default: null,
    required: true 
  })
  qtyAction: number;

  @Prop({
    default: new Date()
  })
  createdAt: Date;

  @Prop({
    default: new Date()
  })
  updatedAt: Date;

  @Prop({
    default: EnumState.PENDING,
    required: true
  })
  state: EnumState;
}

export const KardexSchema = SchemaFactory.createForClass(Kardex);
