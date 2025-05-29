// BasePrices Interface
export interface IBasePrice {
    _id?: string;
    label?: string;
    price?: number;
} 

export interface IBasePrices {
    _id?: string;
    game?: string;
    type?: string;
    currency?: string;
    basePrices?: IBasePrice[];
}

export interface IBasePriceUpdate {
    game: string;
    details: IBasePrice;
  }