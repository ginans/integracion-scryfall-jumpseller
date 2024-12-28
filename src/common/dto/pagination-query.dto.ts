import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'page must be greater than or equal to 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100, { message: 'limit must be lower than or equal to 100' })
  limit?: number = 10;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be either asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsIn(['json', 'excel'], {
    message: 'exportFormat must be either json or excel',
  })
  exportFormat?: 'json' | 'excel';
}
