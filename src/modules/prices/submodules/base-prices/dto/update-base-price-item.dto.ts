import { IsMongoId, IsNumber } from 'class-validator';

export class UpdateBasePriceItemDto {
  @IsMongoId()
  subId: string;

  @IsNumber()
  price: number;
}
