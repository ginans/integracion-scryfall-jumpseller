import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Auth {
  @Prop()
  email: string;
}
//TODO: Añadir más campos a la entidad Auth(Ip, UserAgent, etc)
export type AuthDocument = HydratedDocument<Auth>;
export const AuthSchema = SchemaFactory.createForClass(Auth);
