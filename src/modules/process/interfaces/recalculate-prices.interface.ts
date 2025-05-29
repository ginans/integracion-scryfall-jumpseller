export interface IRecalculatePrices {
  price?: number;
  usdPrice?: number
  gameID?: string, 
  id: string;
  subId: string;
}

export interface IRecalculateFromBasePrice {
  price: number;
  id: string;
  subId: string;
}

export interface IRecalculateFromUsdPrice {
  gameID: string;
  usdPrice: number;
}
