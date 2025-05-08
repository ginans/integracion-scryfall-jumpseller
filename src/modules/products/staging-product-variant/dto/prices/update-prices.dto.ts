import { PartialType } from '@nestjs/mapped-types';
import { CreatePricesDto } from './create-prices.dto';

export class UpdatePricesDto extends PartialType(CreatePricesDto) {}
