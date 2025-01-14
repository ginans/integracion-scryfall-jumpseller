import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryResumeDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isNational?: boolean = true;
}
