import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { TransfersState } from '../enums/transfersState.enum';

export type TransfersDocument = Transfers & Document;

@Schema({
  timestamps: true
})
export class Transfers extends Document {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ 
    required: true, 
    unique: true
  })
  idTransmission: number;

  @Prop({ 
    required: true 
  })
  initialErpReference: string;

  @Prop({ 
    required: true 
  })
  finalErpReference: string;

  @Prop({ 
    required: true 
  })
  facility: string;

  @Prop({ 
    required: true 
  })
  initialZone: string;

  @Prop({ 
    required: true 
  })
  finalZone: string;

  @Prop({ 
    required: true 
  })
  sku: string;

  @Prop({ 
    required: true 
  })
  qtyAction: number;

  @Prop({
    default: null
  })
  createdAtData: Date | null;

  @Prop({
    required: false,
    default: TransfersState.INFORMED
  })
  state: TransfersState;
}

export const TransfersSchema = SchemaFactory.createForClass(Transfers);
