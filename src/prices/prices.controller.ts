import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PricesService } from './prices.service';
import { CreatePriceDto } from './dto/create-price.dto';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Post()
  createPrice(@Body() dto: CreatePriceDto) {
    return this.pricesService.createPrice(dto);
  }

  @Get()
  findAllPrices() {
    return this.pricesService.findAllPrices();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pricesService.findOne(+id);
  }

  @Patch('by-game/:gameID')
  updatePriceByGame(@Param('gameID') gameID: string, @Body('usdPrice') usdPrice: number) {
    return this.pricesService.updatePriceByGame(gameID, usdPrice);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pricesService.remove(+id);
  }
}
