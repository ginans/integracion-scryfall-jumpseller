import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { BasePrice } from "../interfaces/usd-prices.interface";
import { EnumGame } from "../enums/games.enum";

@Schema({ timestamps: true })
export class UsdPrice implements BasePrice {
@Prop({ 
    default: function() {
        if (this.game === EnumGame.POKEMON) {
            return "PK";
        }
        if (this.game === EnumGame.ONEPIECE) {
            return "OP";
        }
        if (this.game === EnumGame.MAGIC) {
        return "MG";
    }
}
})
gameID: string;

  @Prop({ required: true})
  game: string;

  @Prop({ required: true})
  usdPrice: number;

}

export type UsdPriceDocument = HydratedDocument<UsdPrice>;
export const UsdPriceSchema = SchemaFactory.createForClass(UsdPrice);
