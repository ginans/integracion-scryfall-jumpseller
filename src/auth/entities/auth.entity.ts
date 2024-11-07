import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Auth extends Document {
  @Prop()
  email: string;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
