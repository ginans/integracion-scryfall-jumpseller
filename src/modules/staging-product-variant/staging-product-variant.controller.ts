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

  @Get("widthoutPagination")
  async findAllVariantsWithoutPagination(): Promise<IStagingProductVariant[]> {
    return this.stagingProductVariantService.findAllVariantsWithoutPagination();
  }

  @Get('byId/:id')
  async getById(
    @Param('id') id: string
  ) {
    const variantById = await this.stagingProductVariantService.findVariantById(id);
    return variantById;
  }

  @Get('sincronizar-precios-scryfall')
  async calculatePricesForAllCards(variant: IStagingProductVariant) {
    return this.stagingProductVariantService.calculatePricesByVariant(variant);
  }

  @Patch('byId/:id')
  async updateIsPriceUpdateable(
    @Param('id') id: string,
    @Body() variant: IStagingProductVariant
  ) {
    return await this.stagingProductVariantService.updateVariantById(id, variant);
  }

  //actualzarlos todos
  @Patch('update-all-price-updateable')
  async updateAllIsPriceUpdateable(
    @Body('isPriceUpdateable') isPriceUpdateable: boolean
  ) {
    return await this.stagingProductVariantService.updateAllIsPriceUpdateable(isPriceUpdateable);
  }
  
}
