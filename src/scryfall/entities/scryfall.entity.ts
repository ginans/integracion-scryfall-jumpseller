import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { } from '../interfaces/scryfall.interface';

@Schema({ timestamps: true })
export class Scryfall {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

 
}
export type ScryfallDocument = HydratedDocument<Scryfall>;
export const ScryfallSchema = SchemaFactory.createForClass(Scryfall);
