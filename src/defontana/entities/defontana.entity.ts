import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class DefontanaToken {
  @Prop({ required: true })
  access_token: string;

  @Prop({ required: true })
  token_type: string;
}
export type DefontanaTokenDocument = HydratedDocument<DefontanaToken>
export const DefontanaTokenSchema = SchemaFactory.createForClass(DefontanaToken);
