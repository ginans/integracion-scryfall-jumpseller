import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {HydratedDocument} from "mongoose";

@Schema({ timestamps: true })
export class DefontanaCredential {

    @Prop({ required: true })
    client: string;

    @Prop({ required: true })
    company: string;

    @Prop({ required: true })
    user: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    urlApi: string;

    @Prop({ required: true, default: false })
    configIsValid: boolean;
}

export type DefontanaCredentialDocument = HydratedDocument<DefontanaCredential>;
export const DefontanaCredentialSchema = SchemaFactory.createForClass(DefontanaCredential);