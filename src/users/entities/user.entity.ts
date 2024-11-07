import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    default: true,
  })
  status: boolean;

  @Prop()
  name: string;

  @Prop({
    unique: true,
  })
  email: string;

  @Prop()
  password: string;

  @Prop()
  rol: string;
  @Prop()
  lastLogin: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
