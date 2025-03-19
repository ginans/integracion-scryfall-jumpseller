import { Controller, Get, Post, Body} from '@nestjs/common';
import { ProductCardsService } from './product-cards.service';
import { CreateProductCardDto } from './dto/create-product-card.dto';

@Controller('product-cards')
export class ProductCardsController {
  constructor(private readonly productCardsService: ProductCardsService) {}

  @Post()
  async create(@Body() createProductCardDto: CreateProductCardDto) {
    return this.productCardsService.fetchAndCreate(createProductCardDto);
  }

  @Get()
  findAll() {
    return this.productCardsService.findAll(); 
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.productCardsService.findOne(id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProductCardDto: UpdateProductCardDto) {
  //   return this.productCardsService.update(id, updateProductCardDto);
  // }
}
