import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { VariantsService } from './variants.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { IVariant } from './interfaces/variants.interface';

@Controller('variants')
export class VariantsController {
  constructor(
    private readonly variantsService: VariantsService,
  ) {}

  @Get()
  async findAllVariants(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<IVariant>> {
    return this.variantsService.findAllVariants(query);
  }

  @Get('widthoutPagination')
  async findAllVariantsWithoutPagination(): Promise<IVariant[]> {
    return this.variantsService.findAllVariantsWithoutPagination();
  }

  @Get('byId/:id')
  async getById(@Param('id') id: string) {
    const variantById =
      await this.variantsService.findVariantById(id);
    return variantById;
  }

  @Get('sincronizar-precios-scryfall')
  async calculatePricesForAllCards(variant: IVariant) {
    return this.variantsService.calculatePricesByVariant(variant);
  }

  @Patch('byId/:id')
  async updateIsPriceUpdateable(
    @Param('id') id: string,
    @Body() variant: IVariant,
  ) {
    return await this.variantsService.updateVariantById(
      id,
      variant,
    );
  }

  //actualzarlos todos
  @Patch('update-all-price-updateable')
  async updateAllIsPriceUpdateable(
    @Body('isPriceUpdateable') isPriceUpdateable: boolean,
  ) {
    return await this.variantsService.updateAllIsPriceUpdateable(
      isPriceUpdateable,
    );
  }
}
