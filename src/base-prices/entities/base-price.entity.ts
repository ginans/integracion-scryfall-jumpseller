import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { BasePriceConfig, IBasePrice } from "../interface/base-prices.interface";

@Schema({ timestamps: true })
export class BasePrice implements BasePriceConfig {

    @Prop({ required: true })
    game: string;

    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    currency: string;

    @Prop({ type: [{ label: String, price: Number }], required: true })
    basePrices: { 
        label: string, 
        price: number 
    }[];

}

export type BasePriceDocument = HydratedDocument<BasePrice>;
export const BasePriceSchema = SchemaFactory.createForClass(BasePrice);
