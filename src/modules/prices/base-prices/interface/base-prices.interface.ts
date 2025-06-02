import { EnumGame } from "src/common/enums/game.enum";

// BasePrices Interface
export interface IBasePrice {
    _id?: string;
    label?: string;
    price?: number;
} 

export interface IBasePrices {
    _id?: string;
    game?: EnumGame;
    type?: string;
    currency?: string;
    basePrices?: IBasePrice[];
}

export interface IBasePriceUpdate {
    game: EnumGame;
    details: IBasePrice;
  }