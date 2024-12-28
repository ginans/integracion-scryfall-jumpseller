import { IsOptional, IsString } from 'class-validator';

export class FilterQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  filters?: Record<string, any>;
}
