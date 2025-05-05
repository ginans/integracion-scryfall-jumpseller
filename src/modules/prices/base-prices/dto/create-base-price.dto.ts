import { IsString, IsArray, ValidateNested, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyEnum, EnumGame, TypeEnum } from "../enums/create-base-price.enum";

export class CreateBasePriceDto {
  @IsString()
  @IsIn([EnumGame.MAGIC, EnumGame.ONEPIECE, EnumGame.POKEMON])
  game: string;

  @IsString()
  @IsIn([TypeEnum.RARITY]) 
  type: string;

  @IsString()
  @IsIn([ CurrencyEnum.CLP, CurrencyEnum.USD])
  currency: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BasePriceItemDto)
  basePrices: BasePriceItemDto[];
}

export class BasePriceItemDto {
  @IsString()
  label: string;

  @IsNumber()
  price: number;
}



