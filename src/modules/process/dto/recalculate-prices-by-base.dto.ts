import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { IRecalculateFromBasePrice } from '../interfaces/recalculate-prices.interface';

export class RecalculatePricesByBaseDto implements IRecalculateFromBasePrice {
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  // @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  subId: string;
}
