// BasePrices Interface
export interface IBasePrice {
    label: string;
    price: number;
} 

export interface IBasePrices {
    game: string;
    type: string;
    currency: string;
    basePrices: IBasePrice[];
}