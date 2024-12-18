import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Client {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  @Prop()
  legalCode: string;
  @Prop()
  fileid: string;
  @Prop()
  name: string;
  @Prop()
  address: string;
  @Prop()
  district: string;
  @Prop()
  email: string;
  @Prop()
  business: string;
  @Prop()
  rubroId: string;
  @Prop()
  giro: string;
  @Prop()
  city: string;
}

export type ClientDocument = HydratedDocument<Client>;
export const clientSchema = SchemaFactory.createForClass(Client);
