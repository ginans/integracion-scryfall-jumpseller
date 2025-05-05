import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { EnumPriceAndStockState } from "../enums/price-and-stock-state.enum";
import { JumpsellerStatus } from "../enums/jumpsellerStatus.enum";
import { IStagingProductVariant } from "../interfaces/stagingProductVariant.interface";


@Schema({ timestamps: true })
export class StagingProductVariant implements IStagingProductVariant {
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;
   
    @Prop({ default: null })
    productId: number;

    @Prop({ default: null })
    variantId: number;
    
    name: string;

    anotherLangName: string;

    @Prop({ default: null })
    sku: string;

    @Prop({ default: null })
    variantPrice: number;

    @Prop({default: true })
    isPriceUpdateable: boolean;

    @Prop({ default: null }) 
    variantStock: number;

    @Prop({ default: 46801 })
    locationId: number | 46801;

    @Prop({ default: false })
    stockUnlimited: boolean;

    @Prop({ default: null })
    finish: string | null;

    @Prop({ default: null })
    rarity: string | null;

    @Prop({ 
        type: Object, 
        default: null 
    })
    imageUrl: {
        large: string | null;
        cardFaceLarge1: string | null;
        cardFaceLarge2: string | null;
        small: string | null;
        cardFaceSmall1: string | null;
        cardFaceSmall2: string | null;
    };

    @Prop({ 
        default: function () {
            return this.variantPrice === 0 ? EnumPriceAndStockState.PENDING : EnumPriceAndStockState.COMPLETED;;
        }
     })
    priceUpdateStatus: EnumPriceAndStockState;

    @Prop({ default: null })
    priceUpdateError: string;

    @Prop({ 
        default: function () {
            return this.variantStock === 0 ? EnumPriceAndStockState.PENDING : EnumPriceAndStockState.COMPLETED;
        }
     })
    stockUpdateStatus: EnumPriceAndStockState;


    @Prop({ default: null })
    stockUpdateError: string;

    @Prop({ 
        default: function () {
            return this.variantStock === 0 ? JumpsellerStatus.NOT_AVALIABLE : JumpsellerStatus.AVALIABLE;
        }
     })
    jumpsellerStatus: JumpsellerStatus;

    @Prop({
        type: Object,  
        default: null 
    })
    fatherProduct: {
        oracleId: string | null;
        sku?: string | null;
        description: string | null;
    }
}

export type StagingProductVariantDocument = HydratedDocument<StagingProductVariant>;
export const StagingProductVariantSchema = SchemaFactory.createForClass(StagingProductVariant);