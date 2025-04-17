import { IsEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePriceDto {
  gameID: string;

  @IsString()
  @IsNotEmpty()
  game: string;

  @IsNumber()
  @IsNotEmpty()
  usdPrice: number;
}
