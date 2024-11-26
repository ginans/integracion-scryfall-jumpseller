import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Agilizar extends Document {
  @Prop()
  token: string;
}

export const AgilizarSchema = SchemaFactory.createForClass(Agilizar);
