import { PartialType } from '@nestjs/swagger';
import { CreateBasePriceDto } from './create-base-price.dto';

export class UpdateBasePriceDto extends PartialType(CreateBasePriceDto) {}
