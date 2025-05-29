import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { IRecalculateFromUsdPrice } from '../interfaces/recalculate-prices.interface';

export class RecalculatePricesByUsdDto implements IRecalculateFromUsdPrice {
  @IsNotEmpty()
  @IsNumber()
  usdPrice: number;

  @IsNotEmpty()
  @IsString()
  gameID: string;
}
