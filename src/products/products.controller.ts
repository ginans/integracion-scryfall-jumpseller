import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { IdataProduct, IsetProduct } from './interface/product.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() product: IsetProduct) {
    return this.productsService.createOrUpdateProduct(product);
  }

   @Get()
    async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<IdataProduct>> {
      return this.productsService.findAllProducts(query); 
    }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.productsService.findOne(id);
  // }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.productsService.update(id);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.productsService.remove(+id);
  // }
}
