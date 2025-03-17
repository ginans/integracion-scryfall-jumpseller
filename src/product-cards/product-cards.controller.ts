import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductCardsService } from './product-cards.service';
import { CreateProductCardDto } from './dto/create-product-card.dto';
import { UpdateProductCardDto } from './dto/update-product-card.dto';

@Controller('product-cards')
export class ProductCardsController {
  constructor(private readonly productCardsService: ProductCardsService) {}

  @Post()
  create(@Body() createProductCardDto: CreateProductCardDto) {
    return this.productCardsService.create(createProductCardDto);
  }

  @Get()
  findAll() {
    return this.productCardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productCardsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductCardDto: UpdateProductCardDto) {
    return this.productCardsService.update(+id, updateProductCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productCardsService.remove(+id);
  }
}
