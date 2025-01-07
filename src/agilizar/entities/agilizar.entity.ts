import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Agilizar {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  @Prop()
  token: string;
  @Prop()
  url: string;
  @Prop()
  client_id: string;
  @Prop()
  secret_key: string;
}

export type AgilizarDocument = HydratedDocument<Agilizar>;
export const AgilizarSchema = SchemaFactory.createForClass(Agilizar);
