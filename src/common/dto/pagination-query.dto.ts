import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EnumLang, SortOrder, StateCards } from '../enums/query.enum';
import { JumpsellerStatus } from 'src/modules/staging-product-variant/enums/jumpsellerStatus.enum';
import { EnumPriceAndStockState } from 'src/modules/staging-product-variant/enums/price-and-stock-state.enum';
export class PaginationQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'page must be greater than or equal to 1' })
  page?: number = 1;

  @ApiProperty({ required: false, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500, { message: 'limit must be lower than or equal to 500' })
  limit?: number = 100;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  filters?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  status?: StateCards;

  @IsOptional()
  @IsString()
  jumpsellerStatus?: JumpsellerStatus;

  @IsOptional()
  @IsString()
  stockUpdateStatus?: EnumPriceAndStockState;

  @IsOptional()
  @IsString()
  priceUpdateStatus?: EnumPriceAndStockState;

  @IsOptional()
  @IsString()
  lang?: EnumLang | null;

  @IsOptional()
  @IsString()
  set?: string;

  @IsOptional()
  @IsString()
  setName?: string;
  
}
