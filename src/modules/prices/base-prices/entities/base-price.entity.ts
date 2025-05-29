import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { IBasePrices } from "../interface/base-prices.interface";
import { EnumGame } from "src/common/enums/game.enum";

@Schema({ timestamps: true })
export class BasePrice implements IBasePrices {

    @Prop({ type: Types.ObjectId, auto: true })
    _id: string;
    
    @Prop({ required: true })
    game: EnumGame;

    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    currency: string;

    @Prop({ type: [{ label: String, price: Number }], required: true })
    basePrices: { 
        _id: string,
        label: string, 
        price: number 
    }[];

}

export type BasePriceDocument = HydratedDocument<BasePrice>;
export const BasePriceSchema = SchemaFactory.createForClass(BasePrice);
