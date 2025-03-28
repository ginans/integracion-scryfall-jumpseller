import { Controller, Get, Post, Body, Query, Param, Delete} from '@nestjs/common';
import { ProductCardsService } from './product-cards.service';
import { CreateProductCardDto } from './dto/create-product-card.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { ProductCard } from './entities/product-card.entity';
import { JumpsellerProductRequest } from './interfaces/jumpsellerProductRequest.interface';
import { MappedProductCard } from './interfaces/mapped-product-card.interface';

@Controller('product-cards')
export class ProductCardsController {
  constructor(private readonly productCardsService: ProductCardsService) {}
  
  @Post("get-and-create")
  async create(@Body() createProductCardDto: CreateProductCardDto) {
    return this.productCardsService.fetchAndCreateCards(createProductCardDto);
  }
  
  @Post("create-magic-jumpseller")
  async createJumpsellerProduct(@Body() cards: MappedProductCard): Promise<JumpsellerProductRequest[]> {
    return this.productCardsService.createJumpsellerProducts(cards);
  }
  
  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<ProductCard>> {
    return this.productCardsService.findAllCards(query); 
  }
  
  @Get('by-id/:id')
  async findOne(@Param('id') _id: string): Promise<ProductCard | null> {
    return this.productCardsService.findOneCard(_id);
  }
    
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProductCardDto: UpdateProductCardDto) {
    //   return this.productCardsService.update(id, updateProductCardDto);
  // }
}
