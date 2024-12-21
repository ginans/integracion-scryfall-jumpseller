import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Agilizar {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  @Prop()
  token: string;
}

export type AgilizarDocument = HydratedDocument<Agilizar>;
export const AgilizarSchema = SchemaFactory.createForClass(Agilizar);
