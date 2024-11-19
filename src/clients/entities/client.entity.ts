import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Client extends Document {
  @Prop()
  lastname: string;
  @Prop({
    type: Number,
    unique: true,
    index: true,
  })
  uuid: number;
  @Prop()
  contact: string;
  @Prop()
  web: string;
  @Prop()
  email: string;
  @Prop()
  status: boolean;
  @Prop()
  checkInDate: string;
  @Prop()
  phoneNumber: string;
  @Prop()
  houseNumber: string;
  @Prop()
  giro: number;
  @Prop()
  name: string;
  @Prop()
  obs: string;
  @Prop({
    type: String,
    unique: true,
    index: true,
  })
  rut: string;
  @Prop()
  clientType: number;
}

export const clientSchema = SchemaFactory.createForClass(Client);
