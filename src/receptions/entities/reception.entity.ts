import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from 'mongoose';
import { ReceptionsState } from "../enums/receptionsState.enum";
import { RdrSet } from "./rdrSet.entity";

export type ReceptionDocument =  Reception & Document;

@Schema({
  timestamps: true
})

export class Reception extends Document {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({
    required: true,
  })
  owner: string;

  @Prop({
    required: true,
  })
  comment: string;

  @Prop({
    required: true,
    unique: true
  })
  receptionNbr: string;

  @Prop({
    required: true,
  })
  partialRec: number[];

  @Prop({
    required: true,
  })
  documentNbr: string[];

  @Prop({
    required: true,
  })
  docType: string;

  @Prop({
    required: true,
  })
  providerId: string;

  @Prop({ 
    required: true,
  })
  rdrSet: RdrSet[];

  @Prop({
    required: false,
    default: ReceptionsState.PENDING
  })
  state: ReceptionsState;
}

export const ReceptionsSchema = SchemaFactory.createForClass(Reception);
