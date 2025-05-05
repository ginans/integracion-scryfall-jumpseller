import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StagingProductVariantService } from './staging-product-variant.service';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { IStagingProductVariant } from './interfaces/stagingProductVariant.interface';
import { ObjectId } from 'mongoose';

@Controller('staging-product-variant')
export class StagingProductVariantController {
  constructor(private readonly stagingProductVariantService: StagingProductVariantService) {}

  @Get()
  async findAllVariants(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<IStagingProductVariant>> {
    return this.stagingProductVariantService.findAllVariants(query);
  }

  @Get('byId/:id')
  async findOne(@Param('id') _id: ObjectId) {
    return this.stagingProductVariantService.findOne(_id);
  }

   @Get('sincronizar-precios-scryfall')
  async calculatePricesForAllCards() {
    return this.stagingProductVariantService.calculatePricesForAllCards();
  }

}
