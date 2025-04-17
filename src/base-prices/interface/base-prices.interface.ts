// BasePrices Interface
export interface IBasePrice {
    label: string;
    price: number;
}

export interface BasePriceConfig {
    game: string;
    type: string;
    currency: string;
    basePrices: IBasePrice[];
}

export type BasePrices = BasePriceConfig[];