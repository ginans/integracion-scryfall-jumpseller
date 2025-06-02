export interface IRecalculateFromBasePrice {
  price: number;
  id: string;
  subId: string;
}

export interface IRecalculateFromUsdPrice {
  gameID: string;
  usdPrice: number;
}
