import { Body, Controller, Get } from '@nestjs/common';
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
  @Get('test')
  test(@Body() body: { to: string; from: string }) {
    return this.salesService.test(body);
  }
}
