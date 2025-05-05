import { IsEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUsdPriceDto {
  gameID: string;

  @IsString()
  @IsNotEmpty()
  game: string;

  @IsNumber()
  @IsNotEmpty()
  usdPrice: number;
}
