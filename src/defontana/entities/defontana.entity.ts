import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Defontana extends Document {
  @Prop()
  token: string;
}

export const DefontanaSchema = SchemaFactory.createForClass(Defontana);
