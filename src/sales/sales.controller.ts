import { Body, Controller, Get, Param } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('check')
  checkSales() {
    return this.salesService.checkNewSales();
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }
  @Get(':id')
  generateBoleta(@Param('id') id: string) {
    return this.salesService.generateSale(+id);
  }
  @Get('test')
  test(@Body() body: { to: string; from: string }) {
    return this.salesService.test(body);
  }
}
