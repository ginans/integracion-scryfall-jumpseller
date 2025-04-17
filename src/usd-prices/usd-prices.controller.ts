import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsdPricesService } from './usd-prices.service';
import { CreateUsdPriceDto } from './dto/create-usd-price.dto';

@Controller('usd-prices')
export class UsdPricesController {
  constructor(private readonly usdPricesService: UsdPricesService) {}

  @Post()
  createUsdPrice(@Body() dto: CreateUsdPriceDto) {
    return this.usdPricesService.createPrice(dto);
  }

  @Get()
  findAllUsdPrices() {
    return this.usdPricesService.findAllPrices();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usdPricesService.findOne(+id);
  }

  @Patch('by-game/:gameID')
  updateUsdPriceByGame(@Param('gameID') gameID: string, @Body('usdPrice') usdPrice: number) {
    return this.usdPricesService.updateUsdPriceByGame(gameID, usdPrice);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usdPricesService.remove(+id);
  }
}
