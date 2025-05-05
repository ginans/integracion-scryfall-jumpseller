import { PartialType } from '@nestjs/mapped-types';
import { CreateStagingProductVariantDto } from './create-staging-product-variant.dto';

export class UpdateStagingProductVariantDto extends PartialType(CreateStagingProductVariantDto) {}
