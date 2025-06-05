import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { IRecalculateFromUsdPrice } from '../interfaces/recalculate-prices.interface';
import { Type } from 'class-transformer';
import { EnumGame } from 'src/common/enums/game.enum';

export class RecalculatePricesByUsdDto implements IRecalculateFromUsdPrice {
  @IsNotEmpty()
  @IsNumber()
  usdPrice: number;

  @IsNotEmpty()
  @IsString()
  gameID: string;

}
