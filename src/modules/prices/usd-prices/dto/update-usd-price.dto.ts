import { PartialType } from '@nestjs/swagger';
import { CreateUsdPriceDto } from './create-usd-price.dto';

export class UpdatePriceDto extends PartialType(CreateUsdPriceDto) {}
