import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BasePricesService } from './base-prices.service';
import { CreateBasePriceDto } from './dto/create-base-price.dto';
import { UpdateBasePriceItemDto } from './dto/update-base-price-item.dto';

@Controller('base-prices')
export class BasePricesController {
  constructor(private readonly basePricesService: BasePricesService) {}

  @Post()
  createBasePrice(@Body() createBasePriceDto: CreateBasePriceDto) {
    return this.basePricesService.createBasePrice(createBasePriceDto);
  }

  @Get()
  findAllBasePrices() {
    return this.basePricesService.findAllBasePrices();
  }

  @Get('by-id/:id')
  findOne(@Param('id') id: string) {
    return this.basePricesService.findOne(id);
  }
  @Patch('by-id/subid/:id')
  updateBasePrices(@Param('id') id: string, @Body() updateBasePriceItemDto: UpdateBasePriceItemDto) {
    return this.basePricesService.updatePrices(id, updateBasePriceItemDto);
  }
  

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.basePricesService.remove(+id);
  }
}
