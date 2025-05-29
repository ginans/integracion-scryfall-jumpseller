import { IsMongoId, IsNumber } from 'class-validator';

export class UpdateBasePriceItemDto {
  @IsMongoId()
  subId: string;

  @IsMongoId()
  id: string;

  @IsNumber()
  price: number;
}
