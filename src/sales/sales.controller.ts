import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SalesService } from './sales.service';
import { TicketDto } from './dto/ticket.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}
  @Get()
  findAll() {
    return this.salesService.findAll();
  }
  @Get('check')
  checkSales() {
    return this.salesService.checkNewSales();
  }

  @Post('boleta')
  processSale(@Body() body: TicketDto) {
    return this.salesService.processSale(body);
  }

  @Get('process')
  processSales() {
    return this.salesService.processSales();
  }
  @Get('test')
  test(@Body() body: { to: string; from: string }) {
    return this.salesService.test(body);
  }
  @Get(':id')
  generateBoleta(@Param('id') id: string) {
    return this.salesService.generateSale(+id);
  }
}
