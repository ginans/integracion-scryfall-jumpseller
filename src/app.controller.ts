import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { TicketDto } from './sales/dto/ticket.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  status() {
    return 'ok';
  }
  @Post('factura')
  factura(@Body() body: any) {
    return this.appService.generateSale(body);
  }
  @Post('boleta')
  boleta(@Body() body: TicketDto) {
    return this.appService.generateSale(body);
  }
  @Post('traspaso')
  traspaso() {
    return this.appService.genericResponse();
  }
  @Post('despacho')
  despacho() {
    return this.appService.genericResponse3();
  }
  @Post('notacredito')
  notacredito() {
    return this.appService.genericResponse4();
  }
}
