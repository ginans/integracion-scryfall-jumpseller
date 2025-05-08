import { Types } from "mongoose";
import { EnumPriceAndStockState } from "../enums/price-and-stock-state.enum";
import { JumpsellerStatus } from "../enums/jumpsellerStatus.enum";


export interface IStagingProductVariant {
    _id: Types.ObjectId;
    productId: number | null;
    variantId: number | null;
    name: string;
    anotherLangName: string;
    sku: string | null;
    variantPrice: number | null;
    isPriceUpdateable: boolean;
    variantStock: number | null;
    locationId: number;
    stockUnlimited: boolean;
    finish: string | null;
    rarity: string | null;
    game: string | null;
    imageUrl: {
        large: string | null;
        cardFaceLarge1: string | null;
        cardFaceLarge2: string | null;
        small: string | null;
        cardFaceSmall1: string | null;
        cardFaceSmall2: string | null;
    } | null;
    priceUpdateStatus: EnumPriceAndStockState;
    priceUpdateError: string | null;
    stockUpdateStatus: EnumPriceAndStockState;
    stockUpdateError: string | null;
    jumpsellerStatus: JumpsellerStatus;
    fatherProduct: {
        oracleId: string | null;
        sku?: string | null;
        description: string | null;
        setId: string | null;
        set: string | null;
    } | null;
}

export interface IStockFromFront {
    stock: number;
    productId: number;
    variantId: number;
    locationId?: number;
    stockUnlimited?: boolean;
}

export interface IPriceFromFront {
    productId: number;
    variantId: number;
    variantPrice: number;
    isPriceUpdateable?: boolean;
}